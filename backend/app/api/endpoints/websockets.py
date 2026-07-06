import asyncio
import json
import logging
from typing import List, Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends

from app.core.database import get_redis_client

router = APIRouter()
logger = logging.getLogger("cams.websockets")

class ConnectionManager:
    def __init__(self):
        # Maps store_id (str) to list of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, store_id: str):
        await websocket.accept()
        if store_id not in self.active_connections:
            self.active_connections[store_id] = []
        self.active_connections[store_id].append(websocket)
        logger.info(f"New WebSocket client connected to Store {store_id}")

    def disconnect(self, websocket: WebSocket, store_id: str):
        if store_id in self.active_connections:
            if websocket in self.active_connections[store_id]:
                self.active_connections[store_id].remove(websocket)
                logger.info(f"WebSocket client disconnected from Store {store_id}")
            if not self.active_connections[store_id]:
                del self.active_connections[store_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_store(self, store_id: str, message: dict):
        if store_id in self.active_connections:
            msg_str = json.dumps(message)
            for connection in self.active_connections[store_id]:
                try:
                    await connection.send_text(msg_str)
                except Exception:
                    # Connection might be dead, handled during disconnection
                    pass

manager = ConnectionManager()

@router.websocket("/telemetry/{store_id}")
async def websocket_telemetry_endpoint(websocket: WebSocket, store_id: str):
    """
    Subscribes to Redis pub/sub for the given store_id and forwards telemetry to client.
    """
    await manager.connect(websocket, store_id)
    
    # Initialize redis subscriber
    redis = get_redis_client()
    pubsub = redis.pubsub()
    channel = f"telemetry:store:{store_id}"
    pubsub.subscribe(channel)
    
    async def listen_to_redis():
        try:
            while True:
                # Run blocking Redis listener in non-blocking way
                message = pubsub.get_message(ignore_subscribe_messages=True, timeout=0.1)
                if message and message['type'] == 'message':
                    data = json.loads(message['data'])
                    await websocket.send_json(data)
                await asyncio.sleep(0.01) # Yield execution
        except Exception as e:
            logger.error(f"Error in Redis subscription thread: {e}")
            
    # Run reader task
    listen_task = asyncio.create_task(listen_to_redis())
    
    try:
        while True:
            # Keep connection alive and accept incoming messages if any
            data = await websocket.receive_text()
            # Echo or process client command if needed
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, store_id)
        listen_task.cancel()
        pubsub.unsubscribe(channel)
        pubsub.close()

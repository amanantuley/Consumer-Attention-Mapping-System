import io
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.postgres import ShopperSession, ProductInteraction, Product, Shelf, Store
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

class ReportGenerator:
    @staticmethod
    def get_raw_data(store_id: int, db: Session) -> pd.DataFrame:
        """
        Retrieves store shopper traffic and purchases as a pandas DataFrame.
        """
        results = db.query(
            ShopperSession.tracking_uuid,
            ShopperSession.start_time,
            ShopperSession.end_time,
            ShopperSession.segment,
            ProductInteraction.interaction_type,
            Product.name.label("product_name"),
            Product.category.label("product_category"),
            Product.price
        ).select_from(ShopperSession)\
         .outerjoin(ProductInteraction, ProductInteraction.session_id == ShopperSession.id)\
         .outerjoin(Product, Product.id == ProductInteraction.product_id)\
         .filter(ShopperSession.store_id == store_id)\
         .all()
         
        # Map to dict and create DataFrame
        data = []
        for r in results:
            data.append({
                "shopper_id": r.tracking_uuid,
                "start_time": r.start_time.isoformat() if r.start_time else "",
                "end_time": r.end_time.isoformat() if r.end_time else "",
                "segment": r.segment or "Browser",
                "action": r.interaction_type.value if r.interaction_type else "dwell",
                "product": r.product_name or "",
                "category": r.product_category or "",
                "price": r.price or 0.0
            })
            
        return pd.DataFrame(data)

    @classmethod
    def generate_csv(cls, store_id: int, db: Session) -> io.BytesIO:
        df = cls.get_raw_data(store_id, db)
        buffer = io.BytesIO()
        df.to_csv(buffer, index=False)
        buffer.seek(0)
        return buffer

    @classmethod
    def generate_excel(cls, store_id: int, db: Session) -> io.BytesIO:
        df = cls.get_raw_data(store_id, db)
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name="ShopperTelemetry")
        buffer.seek(0)
        return buffer

    @classmethod
    def generate_pdf(cls, store_id: int, db: Session) -> io.BytesIO:
        df = cls.get_raw_data(store_id, db)
        store = db.query(Store).filter(Store.id == store_id).first()
        store_name = store.name if store else f"Store #{store_id}"
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=24,
            leading=28,
            textColor=colors.HexColor('#1A202C'),
            spaceAfter=15
        )
        body_style = styles['BodyText']
        
        # Title
        story.append(Paragraph(f"CAMS Analytics Report - {store_name}", title_style))
        story.append(Paragraph(f"Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}", body_style))
        story.append(Spacer(1, 20))
        
        # Summary statistics
        total_shoppers = df["shopper_id"].nunique()
        total_actions = len(df)
        total_purchases = len(df[df["action"] == "purchase"])
        conv_rate = (df[df["segment"] == "Buyer"]["shopper_id"].nunique() / total_shoppers * 100.0) if total_shoppers > 0 else 0.0
        
        story.append(Paragraph(f"<b>Executive Summary:</b>", styles['Heading2']))
        story.append(Paragraph(f"Total Unique Shoppers Tracked: {total_shoppers}", body_style))
        story.append(Paragraph(f"Total Recorded Interactions: {total_actions}", body_style))
        story.append(Paragraph(f"Total Completed Purchases: {total_purchases}", body_style))
        story.append(Paragraph(f"Store Conversion Rate: {conv_rate:.2f}%", body_style))
        story.append(Spacer(1, 20))
        
        # Table of recent activities
        story.append(Paragraph(f"<b>Recent Shopper Activities Log (First 15 Rows)</b>", styles['Heading3']))
        
        # Build table data
        table_data = [["Shopper UUID", "Segment", "Action", "Product", "Price"]]
        sample_rows = df.head(15)
        for _, row in sample_rows.iterrows():
            table_data.append([
                str(row["shopper_id"])[:18] + "...",
                str(row["segment"]),
                str(row["action"]),
                str(row["product"]),
                f"${row['price']:.2f}"
            ])
            
        t = Table(table_data, colWidths=[150, 80, 80, 150, 60])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2D3748')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#F7FAFC'), colors.white]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ]))
        
        story.append(t)
        doc.build(story)
        buffer.seek(0)
        return buffer

"""initial migration

Revision ID: 0001_initial
Revises: 
Create Date: 2026-07-07
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'roles',
        sa.Column('id', sa.String(length=50), primary_key=True),
        sa.Column('name', sa.String(length=50), nullable=False)
    )

    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role_id', sa.String(length=50), sa.ForeignKey('roles.id'), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now())
    )

    op.create_table(
        'stores',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False, unique=True),
        sa.Column('address', sa.String(length=255), server_default=''),
        sa.Column('floor_plan_url', sa.String(length=512), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('store_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )

    op.create_table(
        'shelves',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('store_id', sa.String(length=36), sa.ForeignKey('stores.id', ondelete='CASCADE'), nullable=False),
        sa.Column('shelf_name', sa.String(length=255), nullable=False),
        sa.Column('zone_coordinates', sa.JSON(), nullable=True),
        sa.Column('zone_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('position_x', sa.Float(), server_default='0.0'),
        sa.Column('position_y', sa.Float(), server_default='0.0'),
        sa.Column('position_z', sa.Float(), server_default='0.0'),
        sa.Column('width', sa.Float(), server_default='0.0'),
        sa.Column('height', sa.Float(), server_default='0.0'),
        sa.Column('depth', sa.Float(), server_default='0.0'),
        sa.Column('camera_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )

    # Seed roles
    op.execute("INSERT OR IGNORE INTO roles (id, name) VALUES ('SuperAdmin','SuperAdmin')")
    op.execute("INSERT OR IGNORE INTO roles (id, name) VALUES ('StoreManager','StoreManager')")
    op.execute("INSERT OR IGNORE INTO roles (id, name) VALUES ('Analyst','Analyst')")


def downgrade():
    op.drop_table('shelves')
    op.drop_table('stores')
    op.drop_table('users')
    op.drop_table('roles')

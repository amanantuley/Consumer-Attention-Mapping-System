"""add_camera_id_to_shelves

Revision ID: 7a0d4c88b901
Revises: f6617f5c133a
Create Date: 2026-07-25 12:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a0d4c88b901'
down_revision: Union[str, None] = 'f6617f5c133a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add camera_id column to shelves table
    op.add_column('shelves', sa.Column('camera_id', sa.Integer(), nullable=True))
    # Create foreign key constraint
    op.create_foreign_key(
        'fk_shelves_camera_id_cameras',
        'shelves', 'cameras',
        ['camera_id'], ['id']
    )


def downgrade() -> None:
    # Drop foreign key constraint
    op.drop_constraint('fk_shelves_camera_id_cameras', 'shelves', type_='foreignkey')
    # Drop camera_id column
    op.drop_column('shelves', 'camera_id')

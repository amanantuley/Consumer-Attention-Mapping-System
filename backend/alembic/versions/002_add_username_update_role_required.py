"""Add username and make role_id required

Revision ID: 002
Revises: 001
Create Date: 2026-07-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add username column to users table
    op.add_column('users', sa.Column('username', sa.String(length=100), nullable=True))
    # Create unique index for username
    op.create_unique_constraint(None, 'users', ['username'])
    # Update existing rows (if any) with default username
    op.execute("UPDATE users SET username = email WHERE username IS NULL")
    # Make username column not nullable
    op.alter_column('users', 'username', nullable=False)
    # Create index for username
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    # Make role_id column not nullable
    op.alter_column('users', 'role_id', nullable=False)
    
    # Insert default roles
    op.execute("""
        INSERT INTO roles (name, description, created_at) VALUES
        ('Administrator', 'Full system access', NOW()),
        ('Store Manager', 'Manage stores, shelves, and cameras', NOW()),
        ('Retail Analyst', 'View analytics and reports', NOW()),
        ('Marketing Manager', 'View marketing insights', NOW())
        ON CONFLICT (name) DO NOTHING;
    """)


def downgrade() -> None:
    # Drop username index and column
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_constraint(None, 'users', type_='unique')
    op.drop_column('users', 'username')
    # Make role_id nullable again
    op.alter_column('users', 'role_id', nullable=True)

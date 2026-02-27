"""added task_id and status to image model

Revision ID: e9479e1be3b4
Revises: 3d3c4523fe54
Create Date: 2025-11-22 11:23:41.335264

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e9479e1be3b4'
down_revision: Union[str, None] = '3d3c4523fe54'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Define the Enum Type object
    # Make sure these values match your Python Enum class exactly
    image_status_enum = sa.Enum('pending', 'processing', 'completed', 'failed', name='imagestatus')

    # 2. Create the Type in Postgres BEFORE adding the column
    image_status_enum.create(op.get_bind())

    # 3. Add the columns
    op.add_column('generated_images', sa.Column('task_id', sa.String(), nullable=True))
    op.add_column('generated_images', sa.Column('status', image_status_enum, nullable=True))


def downgrade() -> None:
    # 1. Define the Enum Type object so we can target it
    image_status_enum = sa.Enum('pending', 'processing', 'completed', 'failed', name='imagestatus')

    # 2. Drop the columns FIRST
    op.drop_column('generated_images', 'status')
    op.drop_column('generated_images', 'task_id')

    # 3. Drop the Type from Postgres
    image_status_enum.drop(op.get_bind())

"""add_city_and_date_joined_to_user

Revision ID: baf49c1963a0
Revises: d26183712513
Create Date: 2025-10-16 03:55:34.515851

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'baf49c1963a0'
down_revision = 'd26183712513'
branch_labels = None
depends_on = None


def upgrade():
    # Add city column with default value "Bishkek"
    op.add_column('users', sa.Column('city', sa.String(length=30), nullable=False, server_default='Bishkek'))
    
    # Add date_joined column with default value as current timestamp
    op.add_column('users', sa.Column('date_joined', sa.DateTime(), nullable=False, server_default=sa.func.now()))


def downgrade():
    op.drop_column('users', 'date_joined')
    op.drop_column('users', 'city')

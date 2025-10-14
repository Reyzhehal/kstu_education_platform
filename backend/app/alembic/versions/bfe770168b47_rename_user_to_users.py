"""empty message

Revision ID: bfe770168b47
Revises: 217a8be99235
Create Date: 2025-10-15 02:28:33.685716

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'bfe770168b47'
down_revision = '217a8be99235'
branch_labels = None
depends_on = None

def upgrade():
    op.rename_table('user', 'users')
    # опционально: переименовать индексы/уникальные констрейнты, если хотите красивые имена:
    # op.execute('ALTER INDEX IF EXISTS ix_user_username RENAME TO ix_users_username')
    # ...аналогично для других ix_/uq_/fk_ имён, если они есть и вас волнуют их названия.

def downgrade():
    op.rename_table('users', 'user')
    # и обратные ALTER INDEX при необходимости
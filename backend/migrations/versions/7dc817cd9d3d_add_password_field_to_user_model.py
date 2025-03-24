"""Add password field to User model

Revision ID: 7dc817cd9d3d
Revises: 90b4e0ddeafd
Create Date: 2024-03-21 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from werkzeug.security import generate_password_hash

# revision identifiers, used by Alembic.
revision = '7dc817cd9d3d'
down_revision = '90b4e0ddeafd'
branch_labels = None
depends_on = None

def upgrade():
    # Önce password sütununu ekle
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('password', sa.String(length=255), nullable=True))
    
    # Mevcut kullanıcılar için varsayılan şifre ayarla
    connection = op.get_bind()
    connection.execute(
        sa.text("UPDATE user SET password = :password"),
        {"password": generate_password_hash("default_password")}
    )
    
    # Son olarak nullable=False yap
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.alter_column('password',
                            existing_type=sa.String(length=255),
                            nullable=False)

def downgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_column('password')

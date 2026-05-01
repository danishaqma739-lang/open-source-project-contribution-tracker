"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-28 12:00:00
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("github_id", sa.String(length=255), nullable=False),
        sa.Column("github_username", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("access_token", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_users_github_id", "users", ["github_id"], unique=True)
    op.create_index("ix_users_github_username", "users", ["github_username"], unique=True)
    op.create_table(
        "goals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("monthly_pr_target", sa.Integer(), nullable=False),
        sa.Column("current_progress", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "badges",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("badge_name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=False),
        sa.Column("awarded_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "contribution_cache",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("pr_count", sa.Integer(), nullable=False),
        sa.Column("commit_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("contribution_cache")
    op.drop_table("badges")
    op.drop_table("goals")
    op.drop_index("ix_users_github_username", table_name="users")
    op.drop_index("ix_users_github_id", table_name="users")
    op.drop_table("users")

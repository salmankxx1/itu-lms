from fastapi import Depends, HTTPException, status

from auth.oauth2 import get_current_user


class RoleChecker:

    def __init__(self, allowed_roles):

        self.allowed_roles = allowed_roles

    def __call__(self, current_user=Depends(get_current_user)):

        if current_user.role not in self.allowed_roles:

            raise HTTPException(

                status_code=status.HTTP_403_FORBIDDEN,

                detail="Permission Denied"

            )

        return current_user


admin_only = RoleChecker(["admin"])

teacher_only = RoleChecker(["teacher"])

student_only = RoleChecker(["student"])

teacher_admin = RoleChecker(
    ["teacher", "admin"]
)

student_admin = RoleChecker(
    ["student", "admin"]
)

all_users = RoleChecker(
    ["admin", "teacher", "student"]
)
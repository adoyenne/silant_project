from rest_framework.permissions import BasePermission

class IsGuestOrReadOnly(BasePermission):
    """
    Разрешает только просмотр гостям.
    """

    def has_permission(self, request, view):
        return request.method == "GET"


class IsClient(BasePermission):
    """
    Доступ для клиента к своим машинам.
    """

    def has_object_permission(self, request, view, obj):
        return obj.client == request.user


class IsServiceCompany(BasePermission):
    """
    Доступ для сервисной компании к своим машинам.
    """

    def has_object_permission(self, request, view, obj):
        return obj.service_company == request.user


class IsManager(BasePermission):
    """
    Полный доступ для менеджеров.
    """

    def has_permission(self, request, view):
        return request.user.groups.filter(name="manager").exists()
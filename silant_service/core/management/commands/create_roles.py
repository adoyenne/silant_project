from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from core.models import Machine, Maintenance, Claim


class Command(BaseCommand):
    help = "Создает группы пользователей и настраивает права доступа"

    def handle(self, *args, **kwargs):
        # Создание групп и назначение прав
        groups = {
            "guest": [],
            "client": ["view_machine", "view_maintenance", "add_maintenance"],
            "service_company": [
                "view_machine",
                "view_maintenance",
                "add_maintenance",
                "view_claim",
                "add_claim",
            ],
            "manager": [
                "view_machine",
                "add_machine",
                "change_machine",
                "view_maintenance",
                "add_maintenance",
                "change_maintenance",
                "view_claim",
                "add_claim",
                "change_claim",
            ],
        }

        # Получаем типы контента для моделей
        machine_ct = ContentType.objects.get_for_model(Machine)
        maintenance_ct = ContentType.objects.get_for_model(Maintenance)
        claim_ct = ContentType.objects.get_for_model(Claim)

        # Создаём группы и добавляем права
        for group_name, permissions in groups.items():
            group, created = Group.objects.get_or_create(name=group_name)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Создана группа: {group_name}"))

            for perm in permissions:
                try:
                    if "machine" in perm:
                        permission = Permission.objects.get(codename=perm, content_type=machine_ct)
                    elif "maintenance" in perm:
                        permission = Permission.objects.get(codename=perm, content_type=maintenance_ct)
                    elif "claim" in perm:
                        permission = Permission.objects.get(codename=perm, content_type=claim_ct)
                    group.permissions.add(permission)
                except Permission.DoesNotExist:
                    self.stderr.write(f"Ошибка: Права '{perm}' для группы '{group_name}' не найдены.")

            self.stdout.write(self.style.SUCCESS(f"Права для группы '{group_name}' успешно обновлены."))
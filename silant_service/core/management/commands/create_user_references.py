from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import UserReference


class Command(BaseCommand):
    help = 'Создает записи в UserReference для всех пользователей'

    def handle(self, *args, **kwargs):
        users = User.objects.all()

        for user in users:
            # Если пользователя нет в UserReference, создаем его
            user_reference, created = UserReference.objects.get_or_create(user=user)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Пользователь {user.username} добавлен в UserReference"))
            else:
                self.stdout.write(self.style.SUCCESS(f"Пользователь {user.username} уже существует в UserReference"))
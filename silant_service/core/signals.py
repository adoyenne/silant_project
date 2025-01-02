from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from core.models import UserReference

@receiver(post_save, sender=User)
def create_user_reference(sender, instance, created, **kwargs):
    # Проверяем, что это новый пользователь
    if created:
        # Создаем новый объект UserReference для нового пользователя
        UserReference.objects.create(user=instance)
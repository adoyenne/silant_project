from django.db import models
from django.contrib.auth.models import User, Group
from django.db.models import F, ExpressionWrapper, fields
from datetime import timedelta

class Reference(models.Model):
    entity_name = models.CharField("Название сущности", max_length=100)  # Например, "Модель техники"
    name = models.CharField("Название", max_length=100)  # Название элемента справочника
    description = models.TextField("Описание", blank=True)

    def __str__(self):
        return f"{self.entity_name}: {self.name}"

class UserReference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="user_reference", verbose_name="Пользователь")
    group = models.ForeignKey(Group, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Группа пользователя")
    description = models.TextField("Описание", blank=True)

    def __str__(self):
        return self.user.first_name  # Отображаем только first_name

class Machine(models.Model):
    serial_number = models.CharField("Зав. № машины", max_length=255, unique=True)
    model = models.ForeignKey(Reference, on_delete=models.PROTECT, related_name="machines_model",
                               limit_choices_to={'entity_name': 'Модель техники'}, verbose_name="Модель техники")
    engine_model = models.ForeignKey(Reference, on_delete=models.PROTECT, related_name="machines_engine_model",
                                      limit_choices_to={'entity_name': 'Модель двигателя'}, verbose_name="Модель двигателя")
    engine_serial = models.CharField("Зав. № двигателя", max_length=255)
    transmission_model = models.ForeignKey(Reference, on_delete=models.PROTECT, related_name="machines_transmission_model",
                                            limit_choices_to={'entity_name': 'Модель трансмиссии'}, verbose_name="Модель трансмиссии")
    transmission_serial = models.CharField("Зав. № трансмиссии", max_length=255)
    drive_axle_model = models.ForeignKey(Reference, on_delete=models.PROTECT, related_name="machines_drive_axle_model",
                                         limit_choices_to={'entity_name': 'Модель ведущего моста'}, verbose_name="Модель ведущего моста")
    drive_axle_serial = models.CharField("Зав. № ведущего моста", max_length=255)
    steer_axle_model = models.ForeignKey(Reference, on_delete=models.PROTECT, related_name="machines_steer_axle_model",
                                         limit_choices_to={'entity_name': 'Модель управляемого моста'}, verbose_name="Модель управляемого моста")
    steer_axle_serial = models.CharField("Зав. № управляемого моста", max_length=255)
    shipment_date = models.DateField("Дата отгрузки с завода")
    consignee = models.CharField("Грузополучатель (конечный потребитель)", max_length=255)
    delivery_address = models.TextField("Адрес поставки (эксплуатации)")
    configuration = models.TextField("Комплектация (доп. опции)", blank=True)
    client = models.ForeignKey(UserReference, on_delete=models.PROTECT, related_name="client_machines",
                               verbose_name="Покупатель")
    service_company = models.ForeignKey(UserReference, on_delete=models.PROTECT,
                                        related_name="service_company_machines", verbose_name="Сервисная компания")

    def __str__(self):
        return f"{self.model.name} - {self.serial_number}"


class Maintenance(models.Model):
    machine = models.ForeignKey(Machine, on_delete=models.CASCADE, related_name="maintenances")
    maintenance_type = models.ForeignKey(Reference, on_delete=models.PROTECT, related_name="maintenances_type",
                                          limit_choices_to={'entity_name': 'Вид ТО'}, verbose_name="Вид ТО")
    maintenance_date = models.DateField("Дата проведения ТО")
    operating_hours = models.PositiveIntegerField("Наработка, м/час")
    order_number = models.CharField("№ заказ-наряда", max_length=255)
    order_date = models.DateField("Дата заказ-наряда")
    organization = models.ForeignKey(Reference, on_delete=models.PROTECT, related_name="maintenances_organization",
                                      limit_choices_to={'entity_name': 'Организация'}, verbose_name="Организация, проводившая ТО")

    def __str__(self):
        return f"ТО {self.maintenance_type.name} для {self.machine.serial_number}"
class Claim(models.Model):
    machine = models.ForeignKey(Machine, on_delete=models.CASCADE, related_name="claims")
    failure_date = models.DateField("Дата отказа")
    operating_hours = models.PositiveIntegerField("Наработка, м/час")
    failed_node = models.ForeignKey(
        Reference,
        on_delete=models.PROTECT,
        related_name="failed_nodes",
        limit_choices_to={'entity_name': 'Узел отказа'},
        verbose_name="Узел отказа",
    )
    failure_description = models.TextField("Описание отказа")
    recovery_method = models.ForeignKey(
        Reference,
        on_delete=models.PROTECT,
        related_name="recovery_methods",
        limit_choices_to={'entity_name': 'Способ восстановления'},
        verbose_name="Способ восстановления",
    )
    spare_parts = models.TextField("Используемые запасные части", blank=True)
    recovery_date = models.DateField("Дата восстановления")
    downtime = models.PositiveIntegerField(
        "Время простоя техники (ч)", blank=True, null=True, editable=False
    )  # Расчетное поле
    service_company = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Сервисная компания"
    )

    def save(self, *args, **kwargs):
        # Автоматический расчет времени простоя техники
        if self.recovery_date and self.failure_date:
            downtime_days = (self.recovery_date - self.failure_date).days
            self.downtime = max(0, downtime_days)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Рекламация для {self.machine.serial_number}"
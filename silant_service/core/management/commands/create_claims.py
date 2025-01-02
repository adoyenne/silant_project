from datetime import datetime
from django.contrib.auth.models import User
from core.models import Reference, Machine, Claim

# Создание данных для справочников (Узел отказа и Способ восстановления)
failed_node_data = [
    {"entity_name": "Узел отказа", "name": "Двигатель", "description": "Отказ в двигателе"},
    {"entity_name": "Узел отказа", "name": "Трансмиссия", "description": "Отказ в трансмиссии"},
]

recovery_method_data = [
    {"entity_name": "Способ восстановления", "name": "Ремонт узла", "description": "Ремонт поврежденного узла"},
    {"entity_name": "Способ восстановления", "name": "Замена узла", "description": "Замена поврежденного узла"},
]

# Добавление данных в Reference для узлов отказа
for data in failed_node_data:
    Reference.objects.get_or_create(**data)

# Добавление данных в Reference для способов восстановления
for data in recovery_method_data:
    Reference.objects.get_or_create(**data)

# Получение машины с заводским номером 0017
try:
    machine = Machine.objects.get(serial_number="0017")
except Machine.DoesNotExist:
    print("Ошибка: Машина с заводским номером 0017 не найдена.")
    exit()

# Получение справочников для узлов отказа и способов восстановления
failed_node_engine = Reference.objects.get(entity_name="Узел отказа", name="Двигатель")
failed_node_transmission = Reference.objects.get(entity_name="Узел отказа", name="Трансмиссия")
recovery_method_repair = Reference.objects.get(entity_name="Способ восстановления", name="Ремонт узла")
recovery_method_replace = Reference.objects.get(entity_name="Способ восстановления", name="Замена узла")

# Получение пользователя для сервисной компании
try:
    service_company_user = User.objects.get(username="company1")  # Укажите имя пользователя сервисной компании
except User.DoesNotExist:
    print("Ошибка: Сервисная компания не найдена.")
    exit()

# Добавление записей в Claim
claim_1 = Claim.objects.create(
    machine=machine,
    failure_date=datetime.strptime("01/04/2022", "%d/%m/%Y").date(),
    operating_hours=123,
    failed_node=failed_node_engine,
    failure_description="повышенный шум",
    recovery_method=recovery_method_repair,
    spare_parts="прокладки, прочие материалы",
    recovery_date=datetime.strptime("08/04/2022", "%d/%m/%Y").date(),
    service_company=service_company_user,
)

claim_2 = Claim.objects.create(
    machine=machine,
    failure_date=datetime.strptime("02/04/2022", "%d/%m/%Y").date(),
    operating_hours=129,
    failed_node=failed_node_transmission,
    failure_description="проскальзывание",
    recovery_method=recovery_method_repair,
    spare_parts="шестерня ведущая",
    recovery_date=datetime.strptime("07/04/2022", "%d/%m/%Y").date(),
    service_company=service_company_user,
)

claim_3 = Claim.objects.create(
    machine=machine,
    failure_date=datetime.strptime("30/03/2022", "%d/%m/%Y").date(),
    operating_hours=112,
    failed_node=failed_node_transmission,
    failure_description="блокировка колес",
    recovery_method=recovery_method_replace,
    spare_parts="",
    recovery_date=datetime.strptime("31/03/2022", "%d/%m/%Y").date(),
    service_company=service_company_user,
)

# Проверка автоматического расчета времени простоя
claim_1.save()
claim_2.save()
claim_3.save()

print(f"Рекламации для машины {machine.serial_number} добавлены в базу данных.")
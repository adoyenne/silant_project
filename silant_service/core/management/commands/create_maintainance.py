from datetime import datetime
from django.contrib.auth.models import User
from core.models import Reference, Machine, Maintenance

# Создание данных для справочника
maintenance_type_data = [
    {"entity_name": "Вид ТО", "name": "ТО-1 (200 м/час)", "description": "Техническое обслуживание на 200 м/час"},
    {"entity_name": "Вид ТО", "name": "ТО-2 (400 м/час)", "description": "Техническое обслуживание на 400 м/час"},
]

organization_data = [
    {"entity_name": "Организация", "name": "самостоятельно", "description": "Самостоятельное ТО"},
]

# Добавление данных в Reference для видов ТО
for data in maintenance_type_data:
    Reference.objects.get_or_create(**data)

# Добавление данных в Reference для организации
for data in organization_data:
    Reference.objects.get_or_create(**data)

# Получение машины с заводским номером 0017
try:
    machine = Machine.objects.get(serial_number="0017")
except Machine.DoesNotExist:
    print("Ошибка: Машина с заводским номером 0017 не найдена.")
    exit()

# Получение справочников для видов ТО и организации
maintenance_type_1 = Reference.objects.get(entity_name="Вид ТО", name="ТО-1 (200 м/час)")
maintenance_type_2 = Reference.objects.get(entity_name="Вид ТО", name="ТО-2 (400 м/час)")
organization = Reference.objects.get(entity_name="Организация", name="самостоятельно")

# Добавление записей в Maintenance
maintenance_1 = Maintenance.objects.create(
    machine=machine,
    maintenance_type=maintenance_type_1,
    maintenance_date=datetime.strptime("11/04/2022", "%d/%m/%Y").date(),
    operating_hours=210,
    order_number="#2022-16КЕ87СИЛ",
    order_date=datetime.strptime("09/04/2022", "%d/%m/%Y").date(),
    organization=organization,
)

maintenance_2 = Maintenance.objects.create(
    machine=machine,
    maintenance_type=maintenance_type_2,
    maintenance_date=datetime.strptime("19/05/2022", "%d/%m/%Y").date(),
    operating_hours=405,
    order_number="#2022-77КЕ23СИЛ",
    order_date=datetime.strptime("17/05/2022", "%d/%m/%Y").date(),
    organization=organization,
)

print(f"Записи ТО для машины {machine.serial_number} добавлены в базу данных.")
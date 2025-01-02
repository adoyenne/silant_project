from datetime import datetime
from django.contrib.auth.models import User
from core.models import Reference, Machine, UserReference

# Создание данных в справочнике
reference_data = [
    {"entity_name": "Модель техники", "name": "ПД1,5", "description": "Описание модели техники ПД1,5"},
    {"entity_name": "Модель двигателя", "name": "Kubota D1803", "description": "Двигатель Kubota D1803"},
    {"entity_name": "Модель трансмиссии", "name": "10VA-00105", "description": "Трансмиссия, производитель и артикул"},
    {"entity_name": "Модель ведущего моста", "name": "20VA-00101", "description": "Ведущий мост модели 20VA-00101"},
    {"entity_name": "Модель управляемого моста", "name": "VS20-00001", "description": "Управляемый мост модели VS20-00001"},
]

# Добавление данных в Reference
for ref in reference_data:
    Reference.objects.get_or_create(**ref)

# Получение пользователя для клиента и сервисной компании
try:
    client_user = User.objects.get(username="client1")
    service_company_user = User.objects.get(username="company1")
except User.DoesNotExist as e:
    print(f"Ошибка: {e}")
    exit()

# Получение объектов UserReference для клиента и сервисной компании
client_reference = UserReference.objects.get(user=client_user)
service_company_reference = UserReference.objects.get(user=service_company_user)

# Получение объектов Reference для модели, двигателя, трансмиссии и других
model_tech = Reference.objects.get(entity_name="Модель техники", name="ПД1,5")
engine_model = Reference.objects.get(entity_name="Модель двигателя", name="Kubota D1803")
transmission_model = Reference.objects.get(entity_name="Модель трансмиссии", name="10VA-00105")
drive_axle_model = Reference.objects.get(entity_name="Модель ведущего моста", name="20VA-00101")
steer_axle_model = Reference.objects.get(entity_name="Модель управляемого моста", name="VS20-00001")

# Добавление записи в Machine
machine = Machine.objects.create(
    serial_number="0017",
    model=model_tech,
    engine_model=engine_model,
    engine_serial="7ML1035",
    transmission_model=transmission_model,
    transmission_serial="21D0108251",
    drive_axle_model=drive_axle_model,
    drive_axle_serial="21D0107997",
    steer_axle_model=steer_axle_model,
    steer_axle_serial="21D0093265",
    shipment_date=datetime.strptime("09/03/2022", "%d/%m/%Y").date(),
    consignee="ИП Трудников С.В.",
    delivery_address="п. Знаменский, Респ. Марий Эл",
    configuration="1. Гидролинии с БРС;\n2. Дополнительеная установка кабины",
    client=client_reference,  # Используем UserReference для клиента
    service_company=service_company_reference,  # Используем UserReference для сервисной компании
)

print(f"Машина {machine.model.name} с зав. № {machine.serial_number} добавлена в базу данных.")
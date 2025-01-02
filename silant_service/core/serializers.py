from rest_framework import serializers
from .models import Reference, Machine, Maintenance, Claim, UserReference
from django.contrib.auth.models import User, Group
# Сериализатор для User
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name']

# Сериализатор для UserReference
class UserReferenceSerializer(serializers.ModelSerializer):
    user = UserSerializer()  # Вложенный сериализатор для поля 'user'
    groups = serializers.SerializerMethodField()  # Добавляем новое поле для групп

    class Meta:
        model = UserReference
        fields = ['id', 'user', 'description', 'groups']  # Добавляем 'groups'

    def get_groups(self, obj):
        # Получаем все группы пользователя
        return list(obj.user.groups.values_list('name', flat=True))

class ReferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reference
        fields = ["entity_name", "name", "description"]

# Сериализатор для Machine
class MachineSerializer(serializers.ModelSerializer):

    # Оставляем строки для передачи имени модели
    model = serializers.CharField(allow_null=True)
    engine_model = serializers.CharField(allow_null=True)
    transmission_model = serializers.CharField(allow_null=True)
    drive_axle_model = serializers.CharField(allow_null=True)
    steer_axle_model = serializers.CharField(allow_null=True)

    client = serializers.CharField()
    service_company = serializers.CharField()

    recordId = serializers.IntegerField(source='id', read_only=True)

    class Meta:
        model = Machine
        fields = [
            'recordId', 'serial_number', 'model', 'engine_model', 'engine_serial',
            'transmission_model', 'transmission_serial', 'drive_axle_model',
            'drive_axle_serial', 'steer_axle_model', 'steer_axle_serial',
            'shipment_date', 'client', 'service_company', 'consignee',
            'delivery_address', 'configuration'
        ]

    def create(self, validated_data):
        client_name = validated_data.pop('client', None)
        service_company_name = validated_data.pop('service_company', None)

        # Привязка клиента и сервисной компании
        if client_name:
            try:
                client_reference = UserReference.objects.get(user__first_name=client_name)
                validated_data['client'] = client_reference
            except UserReference.DoesNotExist:
                raise serializers.ValidationError({"client": "Client not found."})

        if service_company_name:
            try:
                service_company_reference = UserReference.objects.get(user__first_name=service_company_name)
                validated_data['service_company'] = service_company_reference
            except UserReference.DoesNotExist:
                raise serializers.ValidationError({"service_company": "Service company not found."})

        # Обработка поля model
        model_name = validated_data.pop('model', None)
        if model_name:
            try:
                model = Reference.objects.get(name=model_name)
                validated_data['model'] = model
            except Reference.DoesNotExist:
                raise serializers.ValidationError({"model": "Model not found."})

        # Обработка поля engine_model
        engine_model_name = validated_data.pop('engine_model', None)
        if engine_model_name:
            try:
                engine_model = Reference.objects.get(name=engine_model_name)
                validated_data['engine_model'] = engine_model
            except Reference.DoesNotExist:
                raise serializers.ValidationError({"engine_model": "Engine model not found."})

        # Обработка поля transmission_model
        transmission_model_name = validated_data.pop('transmission_model', None)
        if transmission_model_name:
            try:
                transmission_model = Reference.objects.get(name=transmission_model_name)
                validated_data['transmission_model'] = transmission_model
            except Reference.DoesNotExist:
                raise serializers.ValidationError({"transmission_model": "Transmission model not found."})

        # Обработка поля drive_axle_model
        drive_axle_name = validated_data.pop('drive_axle_model', None)
        if drive_axle_name:
            try:
                drive_axle_model = Reference.objects.get(name=drive_axle_name)
                validated_data['drive_axle_model'] = drive_axle_model
            except Reference.DoesNotExist:
                raise serializers.ValidationError({"drive_axle_model": "Drive axle model not found."})

        # Обработка поля steer_axle_model
        steer_axle_name = validated_data.pop('steer_axle_model', None)
        if steer_axle_name:
            try:
                steer_axle_model = Reference.objects.get(name=steer_axle_name)
                validated_data['steer_axle_model'] = steer_axle_model
            except Reference.DoesNotExist:
                raise serializers.ValidationError({"steer_axle_model": "Steer axle model not found."})

        # Создание объекта Machine с привязанными данными
        machine = Machine.objects.create(**validated_data)
        return machine

    def update(self, instance, validated_data):
        client_name = validated_data.pop('client', None)
        service_company_name = validated_data.pop('service_company', None)

        # Привязка клиента и сервисной компании
        if client_name:
            try:
                client_reference = UserReference.objects.get(user__first_name=client_name)
                instance.client = client_reference
            except UserReference.DoesNotExist:
                raise serializers.ValidationError({"client": "Client not found."})

        if service_company_name:
            try:
                service_company_reference = UserReference.objects.get(user__first_name=service_company_name)
                instance.service_company = service_company_reference
            except UserReference.DoesNotExist:
                raise serializers.ValidationError({"service_company": "Service company not found."})

        # Обработка обновления полей
        model_name = validated_data.pop('model', None)
        if model_name:
            try:
                model = Reference.objects.get(name=model_name)
                instance.model = model
            except Reference.DoesNotExist:
                raise serializers.ValidationError({"model": "Model not found."})

        engine_model_name = validated_data.pop('engine_model', None)
        if engine_model_name:
            try:
                engine_model = Reference.objects.get(name=engine_model_name)
                instance.engine_model = engine_model
            except Reference.DoesNotExist:
                raise serializers.ValidationError({"engine_model": "Engine model not found."})

        transmission_model_name = validated_data.pop('transmission_model', None)
        if transmission_model_name:
            try:
                transmission_model = Reference.objects.get(name=transmission_model_name)
                instance.transmission_model = transmission_model
            except Reference.DoesNotExist:
                raise serializers.ValidationError({"transmission_model": "Transmission model not found."})

        drive_axle_name = validated_data.pop('drive_axle_model', None)
        if drive_axle_name:
            try:
                drive_axle_model = Reference.objects.get(name=drive_axle_name)
                instance.drive_axle_model = drive_axle_model
            except Reference.DoesNotExist:
                raise serializers.ValidationError({"drive_axle_model": "Drive axle model not found."})

        steer_axle_name = validated_data.pop('steer_axle_model', None)
        if steer_axle_name:
            try:
                steer_axle_model = Reference.objects.get(name=steer_axle_name)
                instance.steer_axle_model = steer_axle_model
            except Reference.DoesNotExist:
                raise serializers.ValidationError({"steer_axle_model": "Steer axle model not found."})

        # Обновляем остальные поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Заменяем отображение
        representation['model'] = instance.model.name if instance.model else None
        representation['engine_model'] = instance.engine_model.name if instance.engine_model else None
        representation['transmission_model'] = instance.transmission_model.name if instance.transmission_model else None
        representation['drive_axle_model'] = instance.drive_axle_model.name if instance.drive_axle_model else None
        representation['steer_axle_model'] = instance.steer_axle_model.name if instance.steer_axle_model else None



        return representation

class MachineGuestSerializer(serializers.ModelSerializer):
    model = serializers.CharField(source='model.name', read_only=True)
    engine_model = serializers.CharField(source='engine_model.name', read_only=True)
    transmission_model = serializers.CharField(source='transmission_model.name', read_only=True)
    drive_axle_model = serializers.CharField(allow_null=True)
    steer_axle_model = serializers.CharField(allow_null=True)

    class Meta:
        model = Machine
        fields = [
            'serial_number', 'model', 'engine_model', 'engine_serial',
            'transmission_model', 'transmission_serial', 'drive_axle_model',
            'drive_axle_serial', 'steer_axle_model', 'steer_axle_serial'
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Заменяем отображение
        representation['model'] = instance.model.name if instance.model else None
        representation['engine_model'] = instance.engine_model.name if instance.engine_model else None
        representation['transmission_model'] = instance.transmission_model.name if instance.transmission_model else None
        representation['drive_axle_model'] = instance.drive_axle_model.name if instance.drive_axle_model else None
        representation['steer_axle_model'] = instance.steer_axle_model.name if instance.steer_axle_model else None



        return representation
class MaintenanceSerializer(serializers.ModelSerializer):
    machine = serializers.PrimaryKeyRelatedField(queryset=Machine.objects.all(), required=True)
    maintenance_type = serializers.CharField(required=True)  # строка для создания или поиска
    organization = serializers.CharField(required=True)  # строка для создания или поиска
    serial_number = serializers.CharField(source='machine.serial_number', read_only=True)
    recordId = serializers.IntegerField(source='id', read_only=True)  # Добавляем recordId, связанный с id

    class Meta:
        model = Maintenance
        fields = [
            'recordId',  # Включаем recordId в сериализатор
            'machine',
            'maintenance_type',
            'serial_number',
            'maintenance_date',
            'operating_hours',
            'order_number',
            'order_date',
            'organization',
        ]

    def create(self, validated_data):
        # Извлекаем строки для maintenance_type и organization
        maintenance_type_name = validated_data.pop('maintenance_type')
        organization_name = validated_data.pop('organization')

        # Получаем или создаем записи в Reference
        maintenance_type, _ = Reference.objects.get_or_create(
            name=maintenance_type_name,
            entity_name='Вид ТО'
        )
        organization, _ = Reference.objects.get_or_create(
            name=organization_name,
            entity_name='Организация'
        )

        # Создаем объект Maintenance
        maintenance = Maintenance.objects.create(
            maintenance_type=maintenance_type,
            organization=organization,
            **validated_data
        )

        return maintenance

    def update(self, instance, validated_data):
        # Извлекаем строки для maintenance_type и organization
        maintenance_type_name = validated_data.pop('maintenance_type', None)
        organization_name = validated_data.pop('organization', None)

        # Получаем существующие записи в Reference для maintenance_type и organization
        if maintenance_type_name:
            try:
                maintenance_type = Reference.objects.get(
                    name=maintenance_type_name,
                    entity_name='Вид ТО'
                )
                instance.maintenance_type = maintenance_type  # Обновляем поле maintenance_type
            except Reference.DoesNotExist:
                raise serializers.ValidationError(
                    f"Reference for 'maintenance_type' with name '{maintenance_type_name}' not found.")

        if organization_name:
            try:
                organization = Reference.objects.get(
                    name=organization_name,
                    entity_name='Организация'
                )
                instance.organization = organization  # Обновляем поле organization
            except Reference.DoesNotExist:
                raise serializers.ValidationError(
                    f"Reference for 'organization' with name '{organization_name}' not found.")

        # Обновляем другие поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()  # Сохраняем изменения в объекте
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Заменяем отображение maintenance_type и organization на их имена
        representation['maintenance_type'] = instance.maintenance_type.name if instance.maintenance_type else None
        representation['organization'] = instance.organization.name if instance.organization else None

        return representation

class ClaimSerializer(serializers.ModelSerializer):
    machine = serializers.PrimaryKeyRelatedField(queryset=Machine.objects.all(), required=True)
    serial_number = serializers.CharField(source='machine.serial_number', read_only=True)
    failed_node = serializers.CharField(required=True)  # строка для создания или поиска
    #recovery_method = serializers.CharField(source='recovery_method.name', read_only=True)
    recovery_method = serializers.CharField(required=True)  # строка для создания или поиска
    service_company = serializers.CharField(source='service_company.first_name', read_only=True)
    recordId = serializers.IntegerField(source='id', read_only=True)  # Добавляем recordId, связанный с id

    class Meta:
        model = Claim
        fields = [
            'recordId',
            'machine',
            'serial_number',
            'failure_date',
            'operating_hours',
            'failed_node',
            'failure_description',
            'recovery_method',
            'spare_parts',
            'recovery_date',
            'downtime',
            'service_company'
        ]

    def create(self, validated_data):
        # Извлекаем строки для maintenance_type и organization
        failed_node_name = validated_data.pop('failed_node')
        recovery_method_name = validated_data.pop('recovery_method')

        # Получаем или создаем записи в Reference
        failed_node, _ = Reference.objects.get_or_create(
            name=failed_node_name,
            entity_name='Узел отказа'
        )
        recovery_method, _ = Reference.objects.get_or_create(
            name=recovery_method_name,
            entity_name='Способ восстановления'
        )

        # Создаем объект Maintenance
        сlaim = Claim.objects.create(
            failed_node=failed_node,
            recovery_method=recovery_method,
            **validated_data
        )

        return сlaim

    def update(self, instance, validated_data):
        # Извлекаем строки для failed_node и recovery_method
        failed_node_name = validated_data.pop('failed_node', None)
        recovery_method_name = validated_data.pop('recovery_method', None)

        # Получаем существующие записи в Reference для failed_node и recovery_method
        if failed_node_name:
            try:
                failed_node = Reference.objects.get(
                    name=failed_node_name,
                    entity_name='Узел отказа'
                )
                instance.failed_node = failed_node  # Обновляем поле failed_node
            except Reference.DoesNotExist:
                raise serializers.ValidationError(
                    f"Reference for 'failed_node' with name '{failed_node_name}' not found.")

        if recovery_method_name:
            try:
                recovery_method = Reference.objects.get(
                    name=recovery_method_name,
                    entity_name='Способ восстановления'
                )
                instance.recovery_method = recovery_method  # Обновляем поле recovery_method
            except Reference.DoesNotExist:
                raise serializers.ValidationError(
                    f"Reference for 'recovery_method' with name '{recovery_method_name}' not found.")

        # Обновляем другие поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()  # Сохраняем изменения в объекте
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Заменяем отображение failed_node и recovery_method на их имена
        representation['failed_node'] = instance.failed_node.name if instance.failed_node else None
        representation['recovery_method'] = instance.recovery_method.name if instance.recovery_method else None

        return representation
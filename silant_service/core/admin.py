from django.contrib import admin
from .models import Machine, Maintenance, Claim, Reference, UserReference

admin.site.register(Machine)
admin.site.register(Maintenance)
admin.site.register(Claim)
admin.site.register(Reference)
admin.site.register(UserReference)

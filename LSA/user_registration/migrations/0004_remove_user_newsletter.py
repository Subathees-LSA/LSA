# Generated by Django 5.1.1 on 2024-11-04 06:15

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('user_registration', '0003_user_newsletter'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='newsletter',
        ),
    ]

# Generated by Django 5.1.1 on 2024-11-06 05:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user_registration', '0009_remove_userprofile_kyc_image'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='kyc_image',
            field=models.BinaryField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='kyc_status',
            field=models.CharField(choices=[('pending', 'Pending'), ('verified', 'Verified'), ('rejected', 'Rejected')], default='pending', max_length=10),
        ),
    ]

# Generated manually to add audio fields to ChatMessage

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_create_chat_tables'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatmessage',
            name='audio_file',
            field=models.URLField(
                blank=True,
                help_text='URL del archivo de audio (Cloudinary/S3)',
                max_length=500,
                null=True
            ),
        ),
        migrations.AddField(
            model_name='chatmessage',
            name='audio_duration',
            field=models.FloatField(
                blank=True,
                help_text='Duración del audio en segundos',
                null=True
            ),
        ),
        migrations.AlterField(
            model_name='chatmessage',
            name='message_type',
            field=models.CharField(
                choices=[
                    ('text', 'Text'),
                    ('image', 'Image'),
                    ('audio', 'Audio'),
                    ('file', 'File'),
                ],
                default='text',
                max_length=20
            ),
        ),
    ] 
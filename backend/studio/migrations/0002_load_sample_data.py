from __future__ import annotations

from django.db import migrations


def load_sample_data(apps, schema_editor):
    from studio.data import bootstrap_sample_data

    bootstrap_sample_data(force=False, apps=apps)


def noop_reverse(apps, schema_editor):
    # Leaving sample fixtures in place on downgrade keeps the local editor usable.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("studio", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(load_sample_data, noop_reverse),
    ]

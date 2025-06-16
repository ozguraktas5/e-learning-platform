import logging
# Günlükleme modülünü içe aktar.

from logging.config import fileConfig
# Günlükleme yapılandırmasını dosyadan içe aktar.

from flask import current_app
# Flask uygulamasının mevcut örneğini içe aktar.

from alembic import context
# Alembic kütüphanesinden bağlamı içe aktar.

# Bu, Alembic yapılandırma nesnesidir ve kullanılan .ini dosyasındaki değerlere erişim sağlar.
config = context.config

# Python günlükleme için yapılandırma dosyasını yorumla.
fileConfig(config.config_file_name)
# Günlükleyicileri ayarlamak için yapılandırma dosyasını kullan.

logger = logging.getLogger('alembic.env')
# 'alembic.env' adıyla bir günlükleyici oluştur.

def get_engine():
    try:
        # Flask-SQLAlchemy<3 ve Alchemical ile çalışır.
        return current_app.extensions['migrate'].db.get_engine()
    except (TypeError, AttributeError):
        # Flask-SQLAlchemy>=3 ile çalışır.
        return current_app.extensions['migrate'].db.engine


def get_engine_url():
    try:
        return get_engine().url.render_as_string(hide_password=False).replace(
            '%', '%%')
    except AttributeError:
        return str(get_engine().url).replace('%', '%%')
# Veritabanı motorunun URL'sini al ve şifreyi gizleme seçeneği ile döndür.

# Modelinizin MetaData nesnesini buraya ekleyin, 'autogenerate' desteği için.

config.set_main_option('sqlalchemy.url', get_engine_url())
# SQLAlchemy URL'sini yapılandırma dosyasına ayarla.
target_db = current_app.extensions['migrate'].db
# Hedef veritabanı nesnesini al.

# env.py'nin ihtiyaçları tarafından tanımlanan yapılandırmadan diğer değerler alınabilir.

def get_metadata():
    if hasattr(target_db, 'metadatas'):
        return target_db.metadatas[None]
    return target_db.metadata
# Veritabanı nesnesinin metadata'sını al.


def run_migrations_offline():
    """
    # 'offline' modda migrasyonları çalıştır.
    # Bu, bağlamı yalnızca bir URL ile yapılandırır ve bir Motor değil, ancak burada bir Motor da kabul edilebilir.
    # Motor oluşturmayı atlayarak, bir DBAPI'nin mevcut olmasına bile ihtiyaç duymayız.
    # Buradaki context.execute() çağrıları, verilen dizeyi script çıktısına iletir.
    """
    url = config.get_main_option("sqlalchemy.url")
    # Yapılandırmadan SQLAlchemy URL'sini al.
    context.configure(
        url=url, target_metadata=get_metadata(), literal_binds=True
    )
    # Bağlamı yapılandır: URL, hedef metadata ve literal bağlamalar.
    
    with context.begin_transaction():
        context.run_migrations()
        # Migrasyonları çalıştırmak için bir işlem başlat.


def run_migrations_online():
    """
    # 'online' modda migrasyonları çalıştır.
    # Bu senaryoda bir Motor oluşturmalı ve bağlamla bir bağlantı ilişkilendirmeliyiz.

    """

    # Şemada değişiklik olmadığında otomatik bir migrasyon oluşturulmasını önlemek için bu geri çağırma kullanılır.
    def process_revision_directives(context, revision, directives):
        if getattr(config.cmd_opts, 'autogenerate', False):
            script = directives[0]
            if script.upgrade_ops.is_empty():
                directives[:] = []
                logger.info('No changes in schema detected.')
                # Şemada değişiklik tespit edilmediğini günlüğe kaydet.

    conf_args = current_app.extensions['migrate'].configure_args
    # Yapılandırma argümanlarını al.
    if conf_args.get("process_revision_directives") is None:
        conf_args["process_revision_directives"] = process_revision_directives
        # Geri çağırmayı yapılandırma argümanlarına ekle.

    connectable = get_engine()
    # Bağlanabilir bir motor al.

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=get_metadata(),
            **conf_args
        )
        # Bağlantıyı yapılandır ve hedef metadata ile birlikte yapılandırma argümanlarını ekle.

        with context.begin_transaction():
            context.run_migrations()
            # Migrasyonları çalıştırmak için bir işlem başlat.

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
# Bağlamın çevrimiçi veya çevrimdışı modda olup olmadığını kontrol et ve uygun migrasyon fonksiyonunu çalıştır.
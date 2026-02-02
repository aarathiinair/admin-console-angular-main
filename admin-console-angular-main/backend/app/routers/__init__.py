from . import auth, config, users, triggers, report, maintenance, servers, notifications, webhooks
#from . import certificate_watcher
from . import certificates  

all_routers = [certificates.router,  auth.router, users.router, triggers.router, config.router, report.router, maintenance.router, servers.router, notifications.router, webhooks.router]
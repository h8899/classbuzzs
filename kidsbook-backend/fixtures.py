import os
import django


os.environ.setdefault(
    'DJANGO_SETTINGS_MODULE', 'backend.settings'
)
django.setup()

from kidsbook.models import *  # noqa

print("COME HERE")
User.objects.create_roles()
User.objects.create_superuser(
    email_address='a@a.com',
    username='Best teacher',
    password='a',
    description='Call me by A',
    realname="Sreyans Sipanis"
)

HIEU = User.objects.create_superuser(
    email_address='hieu@gmail.com',
    username='Tall Guy',
    password='a',
    description='Call me by Hieu',
    realname="Le Trung Hieu"
)

SON = User.objects.create_superuser(
    email_address='son@gmail.com',
    username='Assasin',
    password='a',
    description='Call me by Son',
    realname="Nguyen Thanh Son"
)

SREYANS = User.objects.create_user(
    email_address='sreyans@gmail.com',
    username='Assasina',
    password='a',
    description='Call me by Sreyans',
    realname='Sreyans Sipanis',
)


HIEU_GROUP = Group.objects.create_group(
    name='HIEU_GROUP',
    creator = HIEU
)

HIEU_GROUP2 = Group.objects.create_group(
    name='HIEU_GROUP2',
    creator = HIEU
)


HIEU_GROUP.add_member(SON)
HIEU_GROUP.add_member(SREYANS)

YEE_CHIN = User.objects.create_virtual_user(
    email_address='yeechin@gmail.com',
    username='AssasinYeeChin',
    password='a',
    description='Call me by Sreyans',
    realname='Sreyans Sipanis',
    teacher=HIEU
)
# HIEU_GROUP.add_member(YEE_CHIN)

SON_GROUP = Group.objects.create_group(
    name='SON_GROUP',
    creator = SON
)


SON_GROUP.add_member(HIEU)

HIEU_POST = Post.objects.create_post(
    content='Need someone to eat lunch at pgp?',
    creator= HIEU,
    group=HIEU_GROUP
)

HIEU_POST2 = Post.objects.create_post(
    content='Need someone to eat lunch at pgp? Second time',
    creator= HIEU,
    group=HIEU_GROUP
)

SON_COMMENT = Comment.objects.create_comment(
    content='OKAY',
    post=HIEU_POST,
    creator=SON
)
print("FINISHED")

# Add a Bot to be the creator of auto-generated groups
User.objects.create_superuser(
    email_address='i_am_a_creator_group_robot',
    username='group_creator_bot',
    password='a',
    realname="Group Creator Bot"
)

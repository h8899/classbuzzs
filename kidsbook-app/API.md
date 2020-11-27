# Notes

- We will not care about performance / pagination issues for now
- Alias is only for implementation on frontend, nothing have to be added on the backend
- Each user **must** join at least 1 group
- Legend for icons
    - 🌟 SuperUser only
    - ✅ API done
    - 🤔 To be confirmed
    - 👉 Alias

---

# User

- User.login(username, password) ✅
    - Login a user
    - API: `POST /user/login`

- User.logout() ✅
    - Logout a user
    - API: `POST /user/logout`
    
- User.loginAs(user_id) 🌟
    - Login as another user (usually Virtual user)
    - Alias: `VirtualAccount.loginAs(account_id)`
    - API: `POST /users/loginAs`

- User.create(group_id, full_name, email, type) 🌟 ✅
    - Create a user, and add into the group
    - `type` is enum, can be `ADMIN`, `SUPERUSER`, `USER` or `VIRTUAL_USER`
    - API: `POST /user/register/`

- User.import(group_id, csv_data) 🌟 ✅
    - Import users from CSV into the group
    - Transactional: Either all rows success, or all fail
    - Make sure to throw all errors when parsing the CSV
    - API: `POST /batch/create/user/{filename}/`

- User.get(user_id) ✅
    - Get user information
    - Normal users will only be able to get public info and stats without `email`, unless it is his own info
    - The info should include the group the user belongs to, for **SuperUser** or himself only
    - API: `GET /user/[user_id]/profile/`

- User.getAll(group_id, type) 🌟 👉 ✅
    - Get all users in a group
    - Main: `Group.getAllUsers(group_id, type)`
    - API: `GET /[group_id]/user/`

- User.update(user_id, display_name, full_name, email, photo, about, old_password, new_password) (DONE BUT NOT UPDATE ALL FIELDS, NEED TO DISCUSS)
    - Update a user
    - `full_name` can only be updated by **SuperUser**
    - `old_password` and `new_password` must be both present, unless called by **SuperUser**
    - Not all fields are required
    - API: `PUT /users/[user_id]`

- User.forgotPassword(username)
    - Forgot password
    - API: `POST /users/forgot`

- User.delete(user_id) 🌟
    - Delete a user
    - Set a flag in backend: `is_deleted`, this is to prevent foreign key checks fail
    - If `UNIQUE` constraint is applied on `email` column, prefix/suffix something to it
    - For example, `ang@gmail.com` become `ang@gmail.com.deleted.8ab7` (suffix `.deleted.<random>`)
    - When accessing deleted user (in Post / Comment), return `{ id: -1, deleted: true }`
    - API: `DELETE /users/[user_id]`

- User.joinGroup(user_id, group_id) 👉 ✅
    - Join a group
    - Main: `Group.addUser(group_id, user_id)`
    - API: `POST /[group_id]/user/[user_id]/`
    
- User.getAllGroups(user_id) ✅
    - Get all groups the user belongs to
    - Can only be called by **SuperUser** or himself
    - Alias: `Group.getAll(user_id)`
    - API: `GET /group/`

- User.leaveGroup(user_id, group_id) 👉🌟 (DONE, only superuser can remove a person from group)
    - Leave a group
    - Main: `Group.removeUser(group_id, user_id)`
    - API: `DELETE /[group_id]/user/[user_id]`

---

# Group

- Group.create(name, description, photo) 🌟 ✅
    - Create a group
    - When **SuperUser** creates the group, he/she will join automatically 🤔
    - API: `POST /group/`

- Group.get(group_id)
    - Get group information
    - Normal users will only be able to get public info, except **SuperUser**
    - API: `GET /groups/[group_id]`

- Group.getAll(user_id) 👉 (DONE, same as User.getAllGroups(user_id))
    - Get all groups the user belongs to
    - Main: `User.getAllGroups(user_id)`

- Group.update(group_id, name, description, photo) 🌟
    - Update a group
    - Not all fields are required
    - API: `PUT /groups/[group_id]`

- Group.addUser(group_id, user_id) 🌟 (DONE, same as User.joinGroup)
    - Add user to group
    - Alias: `User.joinGroup(group_id)`
    - API: `POST /groups/[group_id]/users`

- Group.getAllUsers(group_id, type) 🌟 ✅
    - Get all users in a group (But only public profile)
    - `type` is optional, usually set to `VIRTUAL` (WHY NEED THIS?)
    - Alias: `User.getAll(group_id, type)`
    - API: `GET /group/[group_id]/user/`

- Group.removeUser(group_id, user_id) 🌟 ✅
    - Remove user from group
    - Each group must have at least one **SuperUser**
    - Alias: `User.leaveGroup(group_id)`
    - API: `DELETE /group/[group_id]/user/[user_id]/`

- Group.createPost(group_id, type, content, payload) (DONE, TO BE DOCUMENTED)
    - Create a post
    - The user must be inside the group to post contents
    - Alias: `Post.create(group_id, type, content, payload)`
    - API: `POST /groups/[group_id]/posts`

- Group.getAllPosts(group_id) (DONE, TO BE DOCUMENTED)
    - Get all posts in a group
    - The user must be inside the group to read them
    - Alias: `Post.getAll(group_id)`
    - API: `GET /groups/[group_id]/posts`

- Group.createReport(group_id, post_id, comment_id)
    - Report a post
    - `comment_id` can be `NULL` if it is a post
    - Alias: `Report.create(post_id, comment_id)` or `Post.report(post_id)` or `Comment.report(comment_id)`
    - API: `POST /groups/[group_id]/reports`

- Group.getAllReports(group_id)
    - Get all reports in a group
    - Alias: `Report.getAll(group_id)`
    - API: `GET /groups/[group_id]/reports`

---

# Post

- Post.create(group_id, type, content, payload) 👉 (DONE, TO BE DOCUMENTED)
    - Create a post
    - Main: `Group.createPost(group_id, type, content, payload)`

- Post.get(post_id) (DONE, TO BE DOCUMENTED)
    - Get a single post
    - The user must be inside the group of the post created to read it
    - API: `GET /posts/[post_id]`

- Post.getAll(group_id) 👉 (DONE,TO BE DOCUMENTED)
    - Get all posts in a group
    - Main: `Group.getAllPosts(group_id)`

- Post.delete(post_id) 🌟
    - Delete a post
    - Set a flag in backend: `is_deleted`
    - API: `DELETE /posts/[post_id]`

- Post.createComment(post_id, text) (DONE, TO BE DOCUMENTED)
    - Create a comment on a post
    - Alias: `Comment.create(post_id, text)`
    - API: `POST /posts/[post_id]/comments`

- Post.getAllComments(post_id) (DONE, TO BE DOCUMENTED)
    - Get all comments for a post
    - Alias `Comment.getAll(post_id)`
    - API: `GET /posts/[post_id]/comments`

- Post.createLike(post_id) (DONE, TO BE DOCUMENTED)
    - Like on a post
    - Alias `PostLike.create(post_id)`
    - API: `POST /posts/[post_id]/likes`

- Post.removeLike(post_id)
    - Remove a like on a post
    - Alias `PostLike.remove(post_id)`
    - API: `DELETE /posts/[post_id]/likes`

- Post.report(post_id) 👉 (DONE, TO BE DOCUMENTED)
    - Report a post
    - Main: `Report.create(post_id, comment_id)`

---

# Comment

- Comment.create(post_id, text) 👉 (DONE, TO BE DOCUMENTED)
    - Create a comment on a post
    - Main: `Post.createComment(post_id, text)`

- Comment.get(comment_id) (DONE, TO BE DOCUMENTED)
    - Get a single comment
    - API: `GET /comments/[comment_id]`

- Comment.getAll(post_id) 👉 (DONE, TO BE DOCUMENTED)
    - Get all comments for a post
    - Main: `Post.getAllComments(post_id)`

- Comment.delete(comment_id) 🌟 
    - Delete a comment (Set a flag in backend: is_deleted)
    - API: `DELETE /comments/[comment_id]`

- Comment.createLike(comment_id) (DONE, TO BE DOCUMENTED)
    - Like on a comment
    - Alias `CommentLike.create(comment_id)`
    - API: `POST /comments/[comment_id]/likes`

- Comment.removeLike(comment_id)
    - Remove a like on a comment
    - Alias `CommentLike.remove(comment_id)`
    - API: `DELETE /comments/[comment_id]/likes`

- Comment.report(comment_id) 👉(DONE, TO BE DOCUMENTED)
    - Report a comment
    - Main: `Report.create(post_id, comment_id)`

---

# Like

- PostLike.create(post_id) 👉(DONE, TO BE DOCUMENTED)
    - Like on a post
    - Main: `Post.createLike(post_id)`

- PostLike.remove(post_id) 👉
    - Remove a like on a post
    - Main: `Post.removeLike(post_id)`

- CommentLike.create(comment_id) 👉 (DONE, TO BE DOCUMENTED)
    - Like on a comment
    - Main: `Comment.createLike(comment_id)`

- CommentLike.remove(comment_id) 👉
    - Remove a like on a comment
    - Main: `Comment.removeLike(comment_id)`

---

# Report

- Report.create(post_id, comment_id) 👉
    - Report a post
    - Main: `Group.createReport(group_id, post_id, comment_id)`

- Report.getAll(group_id) 👉
    - Get all reports in a group
    - Main: `Group.getAllReports(group_id)`

- Report.update(report_id, status) 🌟
    - Update the status of the report
    - `status` is enum, can be `IN_PROGRESS` or `RESOLVED`
    - API: `PUT /reports/[report_id]`

---

# VirtualAccount

**Notes**: `VirtualAccount` will not be stored in another table, it is also a `User` but different type

- VirtualAccount.getAll() 🌟 👉 ✅
    - Get all virtual accounts that the user can use
    - Main: `User.getAllVirtual()`
    - API: `GET /user/virtual_users/`

- VirtualAccount.loginAs(account_id) 🌟 👉
    - Switch to specific virtual account
    - Main: `User.loginAs()`

- VirtualAccount.create(name, photo) 🌟 👉 (DONE, refer to User.create in section 1)
    - Create a new virtual account
    - Main: `User.createVirtual(name, photo)`

---

# Notification

- Notification.getAll(group_id)
    - Get all notifications of the user in a group
    - Limit to last 50 for now
(WIP)

---

# Analytics

(WIP)

# Design Decision

We should have a Singleton utility `Alert` that handles all alert related functionalities (such as `Dialog`, `Snackbar` and `Popover`), with Redux states but handling with page navigation is not easy.

For now, 2 global Singleton object `SnackBarHelper` and `DialogHelper` have been created to handle this, it is **NOT** a good practice but we are running out of time.

# Nested Property

Should consider using function like `_.get()` or better method to get nested property to prevent crashing

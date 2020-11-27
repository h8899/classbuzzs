# Formatter

- Migrate everything to formatter for better compatibility

# Handle expired/invalidated tokens

- Handle error 401 `{"detail": "Signature has expired."}` by logout user and force re-login

# Comments performance issues

- Comments should not be loaded in full until necessary

# Redux action shouldn't directly call UI

- Move all notification / dialog box to `getDerivedStateFromProps()`

# Use async/await on redux actions

- Instead of detecting changes on `getDerivedStateFromProps()`, just use `async` and `await` for simple actions (and make life simpler)

# Function signature

- Use options instead of parameters for functions with more than 3 parameters
- Consistent naming camelCase vs snake_case

# Data validation

- Assume data in the redux store is always correct

# Initialize State

- State not initialize in `SettingsPage.js` and `GroupSettingsPage.js`, can shorten down different fields into `name` property of input

# State update

- Instead of prepopulating fields on `getDerivedStateFromProps()`, do it using `this.props.user[this.auth.effectiveUser].username || this.state.username`

# Cropped photos

- Photos are now cropped to fit, should have better alternatives such as zoom when clicked

# Array merging

- Is use of `mergeArray` good? It might cause unexpected behaviour for not removing things that should be removed
- There are also issues with ordering, might have to reconsider how to implemenet it

# PWA

- Handle offline capabilities
- Fallback when server / user offline

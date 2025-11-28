# Change Log

All notable changes to the "text-work" extension will be documented in this file.

## [0.0.3] – CI Pipeline Fix

### Fixed
- Fixed CI pipeline failure by ensuring `package-lock.json` is correctly tracked and updated.

## [0.0.2] – Font masking support and project cleanup

### Added
- Support for the custom masking font (`PasswordMask`), enabling hiding text behind asterisks using special tags.
- Font file structure added under the `fonts/` directory (not included in the VSIX).

### Changed
- Improved project organization: separated folders for `fonts/`, `syntaxes/`, and `.github/workflows`.

### Removed
- Unnecessary repository artifacts cleaned (e.g., `.DS_Store`, old VSIX files).
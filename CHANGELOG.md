# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [1.4.2] - 2019-06-14

### auth0-gitlab-deploy v2.10.2
### auth0-visualstudio-deploy v2.8.2

- #### Fixed
  - Issue with branches, names of which are containing `/` character.
  
## [1.4.1] - 2019-06-05

### auth0-bitbucket-deploy v2.9.1
### auth0-gitlab-deploy v2.10.1
### auth0-visualstudio-deploy v2.8.1

- #### Fixed
  - Roles management bug
    
## [1.4.0] - 2019-06-04

### auth0-bitbucket-deploy v2.9.0
### auth0-github-deploy v2.9.0
### auth0-gitlab-deploy v2.10.0
### auth0-visualstudio-deploy v2.8.0

- #### Changed
  - `auth0` and `auth0-source-control-extension-tools` modules version updated to `2.17.0` and `3.4.0`
- #### Added
  - Roles management support
  - `AUTH0_ALLOW_DELETE` option. WARNING: enabling this option will allow the extension to remove from the tenant all objects that does not exist in the repository.
  
## [1.3.1] - 2019-05-02

### auth0-bitbucket-deploy v2.8.1
### auth0-github-deploy v2.8.1
### auth0-gitlab-deploy v2.9.1

- #### Fixed
  - Database connection custom scripts won't be sent, if database customization is disabled in `settings.json`
  
### auth0-visualstudio-deploy v2.7.1

- #### Fixed
  - Database connection custom scripts won't be sent, if database customization is disabled in `settings.json`
- #### Added
  - Added possibility to specify project of the repository for git-repos in format `project/repository`
  
## [1.3.0] - 2019-04-12

### auth0-bitbucket-deploy v2.8.0
### auth0-github-deploy v2.8.0
### auth0-gitlab-deploy v2.9.0
### auth0-visualstudio-deploy v2.7.0

- #### Changed
  - `request-promise` is replaced by `axios`.
  
## [1.2.3] - 2019-03-25

### auth0-bitbucket-deploy v2.7.2

- #### Fixed
  - Bitbucket API pagination issue fixed.

## [1.2.2] - 2019-03-19

### auth0-visualstudio-deploy v2.6.2

- #### Fixed
  - `auth0-visualstudio-deploy` deployment issue fixed.
  
## [1.2.1] - 2019-03-11

### auth0-bitbucket-deploy v2.7.1
### auth0-github-deploy v2.7.1
### auth0-gitlab-deploy v2.8.1
### auth0-visualstudio-deploy v2.6.1

- #### Fixed
  - Validation issues related to new `auth0-source-control-tools` version.

## [1.2.0] - 2019-03-06

### auth0-bitbucket-deploy v2.7.0
### auth0-github-deploy v2.7.0
### auth0-gitlab-deploy v2.8.0
### auth0-visualstudio-deploy v2.6.0

- #### Added
  - Added support for encoded secrets
  - Added UI tool for encoding secrets

## [1.1.3] - 2019-02-22

### auth0-bitbucket-deploy v2.6.4
### auth0-github-deploy v2.6.2
### auth0-gitlab-deploy v2.7.2
### auth0-visualstudio-deploy v2.5.3

- #### Fixed
  - Database settings without scripts bug fixed.

## [1.1.2] - 2019-02-07

### auth0-bitbucket-deploy v2.6.3
### auth0-github-deploy v2.6.1
### auth0-gitlab-deploy v2.7.1
### auth0-visualstudio-deploy v2.5.2

- #### Fixed
  - Required module `auth0-source-control-tools` version issue fixed.

## [1.1.1] - 2019-01-31

### auth0-bitbucket-deploy v2.6.2

- #### Fixed
  - Fixed username secret bug

## [1.1.0] - 2019-01-30

### auth0-bitbucket-deploy v2.6.1
### auth0-visualstudio-deploy v2.5.1

- #### Fixed
  - Extensions categories fixed

## [1.0.0] - 2019-01-29

### auth0-bitbucket-deploy v2.6.0
### auth0-github-deploy v2.6.0
### auth0-gitlab-deploy v2.7.0
### auth0-visualstudio-deploy v2.5.0

- #### Fixed
  - `PUBLIC_WT_URL` bug fixed.

- #### Added
  - Added ability to deploy db-connections settings.

- #### Changed
  - Names of some of the configuration variables has been changed. This breaking change will require manual updating of the configuration variables.




balena-config-json
-----------------

[![npm version](https://badge.fury.io/js/balena-config-json.svg)](http://badge.fury.io/js/balena-config-json)
[![dependencies](https://david-dm.org/balena-io-modules/balena-config-json.png)](https://david-dm.org/balena-io-modules/balena-config-json.png)
[![Build Status](https://travis-ci.org/balena-io-modules/balena-config-json.svg?branch=master)](https://travis-ci.org/balena-io-modules/balena-config-json)
[![Build status](https://ci.appveyor.com/api/projects/status/ndm6cfnvotbsyaqx/branch/master?svg=true)](https://ci.appveyor.com/project/balena-io-modules/balena-config-json/branch/master)

Balena config.json manipulation utilities.

Role
----

The intention of this module is to provide low level utilities to read and write `config.json` from balena devices.

**THIS MODULE IS LOW LEVEL AND IS NOT MEANT TO BE USED BY END USERS DIRECTLY**.

Installation
------------

Install `balena-config-json` by running:

```sh
$ npm install --save balena-config-json
```

Documentation
-------------


* [config](#module_config)
    * [.read(image, type)](#module_config.read) ⇒ <code>Promise</code>
    * [.write(image, type, config)](#module_config.write) ⇒ <code>Promise</code>

<a name="module_config.read"></a>

### config.read(image, type) ⇒ <code>Promise</code>
**Kind**: static method of [<code>config</code>](#module_config)  
**Summary**: Read a config.json from an image  
**Access**: public  
**Fulfil**: <code>Object</code> - config.json  

| Param | Type | Description |
| --- | --- | --- |
| image | <code>String</code> | image or drive path |
| type | <code>String</code> | device type slug |

**Example**  
```js
config.read('/dev/disk2', 'raspberry-pi').then (config) ->
	console.log(config)
```
<a name="module_config.write"></a>

### config.write(image, type, config) ⇒ <code>Promise</code>
**Kind**: static method of [<code>config</code>](#module_config)  
**Summary**: Write a config.json to an image  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| image | <code>String</code> | image or drive path |
| type | <code>String</code> | device type slug |
| config | <code>Object</code> | config.json |

**Example**  
```js
config.write '/dev/disk2', 'raspberry-pi',
	username: 'foobar'
.then ->
	console.log('Done!')
```

Support
-------

If you're having any problem, please [raise an issue](https://github.com/balena-io-modules/balena-config-json/issues/new) on GitHub and the balena team will be happy to help.

Tests
-----

Run the test suite by doing:

```sh
$ gulp test
```

Contribute
----------

- Issue Tracker: [github.com/balena-io-modules/balena-config-json/issues](https://github.com/balena-io-modules/balena-config-json/issues)
- Source Code: [github.com/balena-io-modules/balena-config-json](https://github.com/balena-io-modules/balena-config-json)

Before submitting a PR, please make sure that you include tests, and that `npm run lint` runs without any warning:

```sh
$ gulp lint
```

License
-------

The project is licensed under the Apache 2.0 license.

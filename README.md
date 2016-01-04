resin-config-json
-----------------

[![npm version](https://badge.fury.io/js/resin-config-json.svg)](http://badge.fury.io/js/resin-config-json)
[![dependencies](https://david-dm.org/resin-io/resin-config-json.png)](https://david-dm.org/resin-io/resin-config-json.png)
[![Build Status](https://travis-ci.org/resin-io/resin-config-json.svg?branch=master)](https://travis-ci.org/resin-io/resin-config-json)
[![Build status](https://ci.appveyor.com/api/projects/status/ndm6cfnvotbsyaqx/branch/master?svg=true)](https://ci.appveyor.com/project/resin-io/resin-config-json/branch/master)

Resin.io config.json manipulation utilities.

Role
----

The intention of this module is to provide low level utilities to read and write `config.json` from Resin.io devices.

**THIS MODULE IS LOW LEVEL AND IS NOT MEANT TO BE USED BY END USERS DIRECTLY**.

Installation
------------

Install `resin-config-json` by running:

```sh
$ npm install --save resin-config-json
```

Documentation
-------------


* [config](#module_config)
  * [.read(image, type)](#module_config.read) ⇒ <code>Promise</code>
  * [.write(image, type, config)](#module_config.write) ⇒ <code>Promise</code>

<a name="module_config.read"></a>
### config.read(image, type) ⇒ <code>Promise</code>
**Kind**: static method of <code>[config](#module_config)</code>  
**Summary**: Read a config.json from an image  
**Access:** public  
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
**Kind**: static method of <code>[config](#module_config)</code>  
**Summary**: Write a config.json to an image  
**Access:** public  

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

If you're having any problem, please [raise an issue](https://github.com/resin-io/resin-config-json/issues/new) on GitHub and the Resin.io team will be happy to help.

Tests
-----

Run the test suite by doing:

```sh
$ gulp test
```

Contribute
----------

- Issue Tracker: [github.com/resin-io/resin-config-json/issues](https://github.com/resin-io/resin-config-json/issues)
- Source Code: [github.com/resin-io/resin-config-json](https://github.com/resin-io/resin-config-json)

Before submitting a PR, please make sure that you include tests, and that [coffeelint](http://www.coffeelint.org/) runs without any warning:

```sh
$ gulp lint
```

License
-------

The project is licensed under the Apache 2.0 license.

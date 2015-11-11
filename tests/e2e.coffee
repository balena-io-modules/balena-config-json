m = require('mochainon')
path = require('path')
wary = require('wary')
config = require('../lib/config')
files = require('./images/files.json')

RASPBERRYPI = path.join(__dirname, 'images', 'raspberrypi.img')
EDISON = path.join(__dirname, 'images', 'edison-config.img')

wary.it 'should read a config.json from a raspberrypi',
	raspberrypi: RASPBERRYPI
, (images) ->
	config.read(images.raspberrypi, 'raspberry-pi').then (configJSON) ->
		m.chai.expect(configJSON).to.deep.equal(files.raspberrypi['config.json'])

wary.it 'should write a config.json to a raspberrypi',
	raspberrypi: RASPBERRYPI
, (images) ->
	config.write(images.raspberrypi, 'raspberry-pi', foo: 'bar').then ->
		config.read(images.raspberrypi, 'raspberry-pi').then (configJSON) ->
			m.chai.expect(configJSON).to.deep.equal(foo: 'bar')

wary.it 'should read a config.json from an edison',
	edison: EDISON
, (images) ->
	config.read(images.edison, 'intel-edison').then (configJSON) ->
		m.chai.expect(configJSON).to.deep.equal(files.edison['config.json'])

wary.it 'should write a config.json to an edison',
	edison: EDISON
, (images) ->
	config.write(images.edison, 'intel-edison', foo: 'bar').then ->
		config.read(images.edison, 'intel-edison').then (configJSON) ->
			m.chai.expect(configJSON).to.deep.equal(foo: 'bar')

wary.run().catch (error) ->
	console.error(error, error.stack)
	process.exit(1)

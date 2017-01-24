m = require('mochainon')
Promise = require('bluebird')
resin = require('resin-sdk-preconfigured')
utils = require('../lib/utils')

describe 'Utils:', ->

	describe '.getConfigPartitionInformationByType()', ->

		describe 'given a raspberry-pi manifest', ->

			beforeEach ->
				@getManifestBySlugStub = m.sinon.stub(resin.models.device, 'getManifestBySlug')
				@getManifestBySlugStub.withArgs('raspberry-pi').returns Promise.resolve
					configuration:
						config:
							partition:
								primary: 4
								logical: 1
							path: '/config.json'

			afterEach ->
				@getManifestBySlugStub.restore()

			it 'should eventually become the configuration information', ->
				promise = utils.getConfigPartitionInformationByType('raspberry-pi')
				m.chai.expect(promise).to.eventually.become
					partition:
						primary: 4
						logical: 1
					path: '/config.json'

		describe 'given an edison manifest', ->

			beforeEach ->
				@getManifestBySlugStub = m.sinon.stub(resin.models.device, 'getManifestBySlug')
				@getManifestBySlugStub.withArgs('edison').returns Promise.resolve
					configuration:
						config:
							image: 'config.img'
							path: '/config.json'

			afterEach ->
				@getManifestBySlugStub.restore()

			it 'should eventually become the configuration information', ->
				promise = utils.getConfigPartitionInformationByType('edison')
				m.chai.expect(promise).to.eventually.become
					image: 'config.img'
					path: '/config.json'

		describe 'given a device type manifest without a configuration property', ->

			beforeEach ->
				@getManifestBySlugStub = m.sinon.stub(resin.models.device, 'getManifestBySlug')
				@getManifestBySlugStub.returns(Promise.resolve({}))

			afterEach ->
				@getManifestBySlugStub.restore()

			it 'should be rejected with an error', ->
				promise = utils.getConfigPartitionInformationByType('foobar')
				m.chai.expect(promise).to.be.rejectedWith('Unsupported device type: foobar')

		describe 'given a device type manifest without a configuration.config property', ->

			beforeEach ->
				@getManifestBySlugStub = m.sinon.stub(resin.models.device, 'getManifestBySlug')
				@getManifestBySlugStub.returns(Promise.resolve(configuration: {}))

			afterEach ->
				@getManifestBySlugStub.restore()

			it 'should be rejected with an error', ->
				promise = utils.getConfigPartitionInformationByType('foobar')
				m.chai.expect(promise).to.be.rejectedWith('Unsupported device type: foobar')

const config = Symbol('config')
const isCompleteURL = Symbol('isCompleteURL')
const requestBefore = Symbol('requestBefore')
const requestAfter = Symbol('requestAfter')
class jwRequest {
	[config] = {
		baseURL: '',
		header: {
			'Content-Type': 'application/json;charset=UTF-8'
		},
		// 返回当前请求的task, options。请勿在此处修改options。非必填
		taskHook: undefined,
		method: 'GET',
		dataType: 'json',
		responseType: 'text',
		// #ifdef H5 || APP-PLUS || MP-ALIPAY || MP-WEIXIN
		timeout: 60000, // H5(HBuilderX 2.9.9+)、APP(HBuilderX 2.9.9+)、微信小程序（2.10.0）、支付宝小程序
		// #endif
		notification: ({
			msg
		}) => {
			uni.showToast({
				title: msg,
				icon: 'none'
			})
		},
		afterResponseFormat: ({
			code
		}) => {
			return code === 200;
		}

	}
	// 参数配置初始化
	constructor(options) {
		Object.assign(this[config], options);
	}

	interceptors = {
		request: (func) => {
			if (func) {
				jwRequest[requestBefore] = func
			} else {
				jwRequest[requestBefore] = (request) => request
			}

		},
		response: (func) => {
			if (func) {
				jwRequest[requestAfter] = func
			} else {
				jwRequest[requestAfter] = (response) => response
			}
		}
	}

	static [requestBefore](config) {
		return config
	}

	static [requestAfter](response) {
		return response
	}

	static [isCompleteURL](url) {
		return /(http|https):\/\/([\w.]+\/?)\S*/.test(url)
	}

	setConfig(func) {
		this[config] = func(this[config])
	}

	request(options = {}) {
		// #ifdef H5 || APP-PLUS || MP-ALIPAY || MP-WEIXIN
		// timeout: 60000, // H5(HBuilderX 2.9.9+)、APP(HBuilderX 2.9.9+)、微信小程序（2.10.0）、支付宝小程序
		options.timeout = options.timeout || this[config].timeout;
		// #endif
		options.baseURL = options.baseURL || this[config].baseURL
		options.dataType = options.dataType || this[config].dataType
		options.url = jwRequest[isCompleteURL](options.url) ? options.url : (options.baseURL + options.url)
		options.data = options.data
		options.header = {
			...this[config].header,
			...options.header
		}
		options.method = options.method || this[config].method
		options.taskHook = options.taskHook || this[config].taskHook;
		options = {
			...options,
			...jwRequest[requestBefore](options)
		}

		return new Promise((resolve, reject) => {
			options.success = function (res) {
				resolve(jwRequest[requestAfter](res, options))
			}
			options.fail = function (err) {
				reject(jwRequest[requestAfter](err, options))
			}
			const requestTask = uni.request(options)
			// 请求人物钩子处理
			typeof options.taskHook === 'function' && options.taskHook(requestTask, options);
		})
	}

	/**
	 * 
	 */
	get(url, data, options = {}) {
		options.url = url
		options.data = data
		options.method = 'GET'
		return this._request(options);
	}

	/**
	 * 
	 */
	post(url, data, options = {}) {
		options.url = url
		options.data = data
		options.method = 'POST'
		return this._request(options);
	}

	/**
	 * 
	 */
	put(url, data, options = {}) {
		options.url = url
		options.data = data
		options.method = 'PUT'
		return this._request(options);
	}

	/**
	 * 
	 */
	delete(url, data, options = {}) {
		options.url = url
		options.data = data
		options.method = 'DELETE'
		return this._request(options);
	}

	/**
	 * @param {Object} options
	 */
	_request(options) {
		const afterResponse = (result) => {
			if (true === this[config].afterResponseFormat(result.data)) {
				result.ok = function () {
					return true
				}
			} else {
				result.ok = function () {
					return false
				}
				this[config].notification(result);
			}
			return result
		}
		return this.request(options).then(afterResponse)
	}




}

jwRequest.install = function (Vue) {

}

export default jwRequest
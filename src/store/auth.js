class Auth {
  constructor() {
    this.options = {
      state: {
        user: null
      },
      mutations: {
        login(state, user) {
          state.user = user
          return this.options.mutations.login(state, user);
        },
        logout(state) {
          state.user = null
          return this.options.mutations.login(state);
        },
      },
      actions: {
        autoLogin({
          commit,
          getters,
          dispatch
        }) {
          // 判断本地是否有账号信息，如果有，就自动重新登录
          if (getters.user) {
            dispatch('userRef').then(res => {
              uni.hideLoading();
            }).catch(e => {
              uni.hideLoading();
            });
          } else {
            return this.options.getters.autoLogin && this.options.getters.autoLogin({
              commit, getters, dispatch
            });
          }
        },
        //获取用户信息
        getUser({
          commit
        }, params) {
          return new Promise((resolve, reject) => {
            userGet().then(res => {
              if (res.ok()) {
                const result = res.data;
                if (result.role) {
                  const role = result.role
                  // 更改permission的默认的列表字段
                  if (role.permissionList.length > 0) {
                    try {
                      role.permissions = permissionListToPermissions(role
                        .permissionList);
                      role.permissionList = role.permissions.map(
                        permission => {
                          return permission.permissionId
                        })
                    } catch (e) {
                      console.error(e);
                    }
                  } else {
                    role.permissions = []
                    role.permissionList = []
                  }

                  commit('ROLES', role)
                  commit('SET_INFO', result)

                } else {
                  reject(new Error('请配置该账号的角色与权限！'))
                }
                resolve(res.data);
              } else {
                reject(new Error('请配置该账号的角色与权限！'));
              }
            }).catch(e => {
              reject(e);
            })
          })
        },
        //刷新用户信息
        userRef({
          commit,
          dispatch
        }, params) {
          const cxt = this;
          return new Promise((resolve, reject) => {
            getCurrentUserInfo().then((result) => {
              const {
                data
              } = result;
              commit('SET_INFO', data)
              const tmp = cxt.getters.user;
              console.log('刷新用户信息==', data, tmp);
              tmp.openId = data.openId || '';
              tmp.alipayId = data.alipayId || '';
              commit('login', tmp)
            }).catch(e => {
              reject(new Error('刷新用户信息异常！' + e.message))
            });
          });
        },
        login({
          commit,
          dispatch
        }, params) {
          return new Promise((resolve, reject) => {
            login(params).then(res => {
              if (res.ok()) {
                let tmp = {
                  ...params,
                  ...res.data
                }
                setLoginResult(tmp);
                dispatch('getUser').then((result) => {
                  tmp.openId = result.openId || '';
                  tmp.alipayId = result.alipayId || '';
                  commit('login', tmp)
                });
                resolve(res)
              } else {
                reject(res)
              }
            }).catch(err => {
              reject(err)
            })
          })
        },
        //用户登出操作
        logout({
          commit
        }) {
          commit('logout')
          return this.options.actions.logout && this.options.actions.logout({
            commit
          });
        }
      },
      getters: {
        user: state => {
          if (state.user) {
            return state.user
          }
          return this.options.getters.user && this.options.getters.user(state);
        }
      }
    }
  }
}
export default Auth;

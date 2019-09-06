<template>
	<div>
		<banned v-if="banned" />
		<div v-else>
			<h1 v-if="!socketConnected" class="alert">
				Could not connect to the server.
			</h1>
			<!-- should be a persistant toast -->
			<router-view />
			<toast />
			<what-is-new />
			<mobile-alert />
			<login-modal v-if="modals.header.login" />
			<register-modal v-if="modals.header.register" />
		</div>
	</div>
</template>

<script>
import { mapState, mapActions } from "vuex";

import { Toast } from "vue-roaster";

import Banned from "./components/pages/Banned.vue";
import WhatIsNew from "./components/Modals/WhatIsNew.vue";
import MobileAlert from "./components/Modals/MobileAlert.vue";
import LoginModal from "./components/Modals/Login.vue";
import RegisterModal from "./components/Modals/Register.vue";
import io from "./io";

export default {
	replace: false,
	data() {
		return {
			serverDomain: "",
			socketConnected: true
		};
	},
	computed: mapState({
		loggedIn: state => state.user.auth.loggedIn,
		role: state => state.user.auth.role,
		username: state => state.user.auth.username,
		userId: state => state.user.auth.userId,
		banned: state => state.user.auth.banned,
		modals: state => state.modals.modals,
		currentlyActive: state => state.modals.currentlyActive
	}),
	methods: {
		submitOnEnter: (cb, event) => {
			if (event.which === 13) cb();
		},
		...mapActions("modals", ["closeCurrentModal"])
	},
	mounted() {
		document.onkeydown = ev => {
			const event = ev || window.event;
			if (
				event.keyCode === 27 &&
				Object.keys(this.currentlyActive).length !== 0
			)
				this.closeCurrentModal();
		};

		if (localStorage.getItem("github_redirect")) {
			this.$router.go(localStorage.getItem("github_redirect"));
			localStorage.removeItem("github_redirect");
		}
		io.onConnect(true, () => {
			this.socketConnected = true;
		});
		io.onConnectError(true, () => {
			this.socketConnected = false;
		});
		io.onDisconnect(true, () => {
			this.socketConnected = false;
		});
		lofig.get("serverDomain", res => {
			this.serverDomain = res;
		});
		this.$router.onReady(() => {
			if (this.$route.query.err) {
				let { err } = this.$route.query;
				err = err
					.replace(new RegExp("<", "g"), "&lt;")
					.replace(new RegExp(">", "g"), "&gt;");
				this.$router.push({ query: {} });
				Toast.methods.addToast(err, 20000);
			}
			if (this.$route.query.msg) {
				let { msg } = this.$route.query;
				msg = msg
					.replace(new RegExp("<", "g"), "&lt;")
					.replace(new RegExp(">", "g"), "&gt;");
				this.$router.push({ query: {} });
				Toast.methods.addToast(msg, 20000);
			}
		});
		io.getSocket(true, socket => {
			socket.on("keep.event:user.session.removed", () => {
				window.location.reload();
			});
		});
	},
	components: {
		Toast,
		WhatIsNew,
		MobileAlert,
		LoginModal,
		RegisterModal,
		Banned
	}
};
</script>

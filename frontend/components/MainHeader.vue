<template>
	<nav class="nav is-info">
		<div class="nav-left">
			<router-link class="nav-item is-brand" to="/">
				<img
					:src="`${this.siteSettings.logo_white}`"
					:alt="`${this.siteSettings.siteName}` || `Musare`"
				/>
			</router-link>
		</div>

		<span
			class="nav-toggle"
			:class="{ 'is-active': isMobile }"
			@click="isMobile = !isMobile"
		>
			<span />
			<span />
			<span />
		</span>

		<div class="nav-right nav-menu" :class="{ 'is-active': isMobile }">
			<router-link
				v-if="role === 'admin'"
				class="nav-item is-tab admin"
				to="/admin"
			>
				<strong>Admin</strong>
			</router-link>
			<span v-if="loggedIn" class="grouped">
				<router-link
					class="nav-item is-tab"
					:to="{
						name: 'profile',
						params: { username }
					}"
				>
					Profile
				</router-link>
				<router-link class="nav-item is-tab" to="/settings"
					>Settings</router-link
				>
				<a class="nav-item is-tab" href="#" @click="logout()">Logout</a>
			</span>
			<span v-else class="grouped">
				<a
					class="nav-item"
					href="#"
					@click="
						openModal({
							sector: 'header',
							modal: 'login'
						})
					"
					>Login</a
				>
				<a
					class="nav-item"
					href="#"
					@click="
						openModal({
							sector: 'header',
							modal: 'register'
						})
					"
					>Register</a
				>
			</span>
		</div>
	</nav>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
	data() {
		return {
			isMobile: false,
			frontendDomain: "",
			siteSettings: {
				logo: "",
				siteName: ""
			}
		};
	},
	mounted() {
		lofig.get("frontendDomain").then(frontendDomain => {
			this.frontendDomain = frontendDomain;
		});

		lofig.get("siteSettings").then(siteSettings => {
			this.siteSettings = siteSettings;
		});
	},
	computed: mapState({
		modals: state => state.modals.modals.header,
		role: state => state.user.auth.role,
		loggedIn: state => state.user.auth.loggedIn,
		username: state => state.user.auth.username
	}),
	methods: {
		...mapActions("modals", ["openModal"]),
		...mapActions("user/auth", ["logout"])
	}
};
</script>

<style lang="scss" scoped>
@import "scss/variables/colors.scss";

.nav {
	background-color: $primary-color;
	height: 64px;
	border-radius: 0% 0% 33% 33% / 0% 0% 7% 7%;
	box-shadow: 2px 0 5px 0 rgba(0, 0, 0, 0.16),
		2px 0 10px 0 rgba(0, 0, 0, 0.12);

	.nav-menu.is-active {
		.nav-item {
			color: $dark-grey-2;

			&:hover {
				color: $dark-grey-2;
			}
		}
	}

	a.nav-item.is-tab:hover {
		border-bottom: none;
		border-top: solid 1px $white;
		padding-top: 9px;
	}

	.nav-toggle {
		height: 64px;

		&.is-active span {
			background-color: $dark-grey-2;
		}
	}

	.is-brand {
		font-size: 2.1rem !important;
		line-height: 38px !important;
		padding: 0 20px;
		font-family: Pacifico, cursive;

		img {
			max-height: 38px;
			color: $musareBlue;
		}
	}

	.nav-item {
		font-size: 17px;
		color: $white;

		&:hover {
			color: $white;
		}
	}
	.admin strong {
		color: #9d42b1;
	}
}
.grouped {
	margin: 0;
	display: flex;
	text-decoration: none;
}
</style>

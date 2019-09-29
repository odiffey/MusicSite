<template>
	<div class="app">
		<metadata title="Settings" />
		<main-header />
		<div class="content-wrapper">
			<h2>Settings</h2>
			<div class="settingsContainer">
				<div class="settingsRow">
					<div class="setting">
						<label class="label">Username</label>
						<div class="inputArea">
							<input
								v-model="user.username"
								class="input"
								type="text"
								placeholder="Change username"
							/>
							<button
								class="button is-success"
								@click="changeUsername()"
							>
								<i class="material-icons">
									save
								</i>
							</button>
						</div>
					</div>
					<div class="setting">
						<label class="label">Email</label>
						<div v-if="user.email" class="inputArea">
							<input
								v-model="user.email.address"
								class="input"
								type="text"
								placeholder="Change email address"
							/>
							<button
								class="button is-success"
								@click="changeEmail()"
							>
								<i class="material-icons">
									save
								</i>
							</button>
						</div>
					</div>
				</div>
				<div class="settingsRow">
					<div v-if="password" class="setting">
						<label class="label">Change Password</label>
						<div class="inputArea">
							<input
								v-model="newPassword"
								class="input"
								type="password"
								placeholder="Change password"
							/>
							<button
								class="button is-success"
								@click="changePassword()"
							>
								<i class="material-icons">
									save
								</i>
							</button>
						</div>
					</div>
					<div v-if="!password" class="setting">
						<label class="label">Add password</label>
						<div class="inputArea">
							<button
								v-if="passwordStep === 1 && !password"
								href="#"
								class="button codeButton is-info"
								@click="passwordStep = 2"
							>
								Enter Code
							</button>
							<button
								v-if="passwordStep === 1"
								class="button is-success"
								@click="requestPassword()"
							>
								Request password email
							</button>
							<br />
							<input
								v-if="passwordStep === 2"
								v-model="passwordCode"
								class="input"
								type="text"
								placeholder="Code"
							/>
							<button
								v-if="passwordStep === 2"
								class="button is-success"
								v-on:click="verifyCode()"
							>
								<i class="material-icons">
									save
								</i>
							</button>
							<input
								v-if="passwordStep === 3"
								v-model="setNewPassword"
								class="input"
								type="password"
								placeholder="New password"
							/>
							<button
								v-if="passwordStep === 3"
								class="button is-success"
								@click="setPassword()"
							>
								<i class="material-icons">
									save
								</i>
							</button>
						</div>
					</div>
					<div class="setting buttonsOnly">
						<a
							v-if="!github"
							class="button is-github"
							:href="`${serverDomain}/auth/github/link`"
						>
							<div class="icon">
								<img
									class="invert"
									src="/assets/social/github.svg"
								/>
							</div>
							&nbsp; Link GitHub to account
						</a>
						<button
							v-if="password && github"
							class="button is-danger"
							@click="unlinkPassword()"
						>
							Remove logging in with password
						</button>
						<button
							v-if="password && github"
							class="button is-danger"
							@click="unlinkGitHub()"
						>
							Remove logging in with GitHub
						</button>
						<button
							class="button is-warning"
							@click="removeSessions()"
						>
							Log out everywhere
						</button>
					</div>
				</div>
			</div>
			<main-footer />
		</div>
	</div>
</template>

<script>
import { mapState } from "vuex";

import Toast from "toasters";

import MainHeader from "../MainHeader.vue";
import MainFooter from "../MainFooter.vue";

import io from "../../io";
import validation from "../../validation";

export default {
	components: { MainHeader, MainFooter },
	data() {
		return {
			user: {},
			newPassword: "",
			password: false,
			github: false,
			setNewPassword: "",
			passwordStep: 1,
			passwordCode: "",
			serverDomain: ""
		};
	},
	computed: mapState({
		userId: state => state.user.auth.userId
	}),
	mounted() {
		lofig.get("serverDomain").then(serverDomain => {
			this.serverDomain = serverDomain;
		});

		io.getSocket(socket => {
			this.socket = socket;
			this.socket.emit("users.findBySession", res => {
				if (res.status === "success") {
					this.user = res.data;
					this.password = this.user.password;
					this.github = this.user.github;
				} else {
					new Toast({
						content: "Your are currently not signed in",
						timeout: 3000
					});
				}
			});
			this.socket.on("event:user.linkPassword", () => {
				this.password = true;
			});
			this.socket.on("event:user.linkGitHub", () => {
				this.github = true;
			});
			this.socket.on("event:user.unlinkPassword", () => {
				this.password = false;
			});
			this.socket.on("event:user.unlinkGitHub", () => {
				this.github = false;
			});
		});
	},
	methods: {
		changeEmail() {
			const email = this.user.email.address;
			if (!validation.isLength(email, 3, 254))
				return new Toast({
					content: "Email must have between 3 and 254 characters.",
					timeout: 8000
				});
			if (
				email.indexOf("@") !== email.lastIndexOf("@") ||
				!validation.regex.emailSimple.test(email)
			)
				return new Toast({
					content: "Invalid email format.",
					timeout: 8000
				});

			return this.socket.emit(
				"users.updateEmail",
				this.userId,
				email,
				res => {
					if (res.status !== "success")
						new Toast({ content: res.message, timeout: 8000 });
					else
						new Toast({
							content: "Successfully changed email address",
							timeout: 4000
						});
				}
			);
		},
		changeUsername() {
			const { username } = this.user;
			if (!validation.isLength(username, 2, 32))
				return new Toast({
					content: "Username must have between 2 and 32 characters.",
					timeout: 8000
				});
			if (!validation.regex.azAZ09_.test(username))
				return new Toast({
					content:
						"Invalid username format. Allowed characters: a-z, A-Z, 0-9 and _.",
					timeout: 8000
				});

			return this.socket.emit(
				"users.updateUsername",
				this.userId,
				username,
				res => {
					if (res.status !== "success")
						new Toast({ content: res.message, timeout: 8000 });
					else
						new Toast({
							content: "Successfully changed username",
							timeout: 4000
						});
				}
			);
		},
		changePassword() {
			const { newPassword } = this;
			if (!validation.isLength(newPassword, 6, 200))
				return new Toast({
					content: "Password must have between 6 and 200 characters.",
					timeout: 8000
				});
			if (!validation.regex.password.test(newPassword))
				return new Toast({
					content:
						"Invalid password format. Must have one lowercase letter, one uppercase letter, one number and one special character.",
					timeout: 8000
				});

			return this.socket.emit(
				"users.updatePassword",
				newPassword,
				res => {
					if (res.status !== "success")
						new Toast({ content: res.message, timeout: 8000 });
					else
						new Toast({
							content: "Successfully changed password",
							timeout: 4000
						});
				}
			);
		},
		requestPassword() {
			return this.socket.emit("users.requestPassword", res => {
				new Toast({ content: res.message, timeout: 8000 });
				if (res.status === "success") {
					this.passwordStep = 2;
				}
			});
		},
		verifyCode() {
			if (!this.passwordCode)
				return new Toast({
					content: "Code cannot be empty",
					timeout: 8000
				});
			return this.socket.emit(
				"users.verifyPasswordCode",
				this.passwordCode,
				res => {
					new Toast({ content: res.message, timeout: 8000 });
					if (res.status === "success") {
						this.passwordStep = 3;
					}
				}
			);
		},
		setPassword() {
			const newPassword = this.setNewPassword;
			if (!validation.isLength(newPassword, 6, 200))
				return new Toast({
					content: "Password must have between 6 and 200 characters.",
					timeout: 8000
				});

			if (!validation.regex.password.test(newPassword))
				return new Toast({
					content:
						"Invalid password format. Must have one lowercase letter, one uppercase letter, one number and one special character.",
					timeout: 8000
				});

			return this.socket.emit(
				"users.changePasswordWithCode",
				this.passwordCode,
				newPassword,
				res => {
					new Toast({ content: res.message, timeout: 8000 });
				}
			);
		},
		unlinkPassword() {
			this.socket.emit("users.unlinkPassword", res => {
				new Toast({ content: res.message, timeout: 8000 });
			});
		},
		unlinkGitHub() {
			this.socket.emit("users.unlinkGitHub", res => {
				new Toast({ content: res.message, timeout: 8000 });
			});
		},
		removeSessions() {
			this.socket.emit(`users.removeSessions`, this.userId, res => {
				new Toast({ content: res.message, timeout: 4000 });
			});
		}
	}
};
</script>

<style lang="scss" scoped>
@import "scss/variables/colors.scss";

.content-wrapper {
	padding: 30px 0 calc(230px + 60px) 0;
}
h2 {
	font-size: 36px;
	font-weight: 600;
	margin: 10px 0 15px 0;
	text-align: center;
}
.settingsContainer {
	margin: 0 auto;
	border: 1px solid #a3e0ff;
	background-color: #f4f4f4;
	border-radius: 5px;
	padding: 16px;
	width: 60%;
	.settingsRow {
		display: inline-flex;
		width: 100%;
		.setting {
			margin-top: 10px;
			width: 100%;
			.inputArea {
				display: flex;
				input {
					flex: 2 1 0;
					height: 40px;
				}
				button {
					margin-left: 10px;
					&.codeButton {
						flex-grow: 1;
						margin-left: 0;
						margin-right: auto;
					}
				}
			}
			&:nth-child(even) {
				margin-left: 15px;
			}
			.button,
			button {
				width: auto;
				height: 40px;
				&.is-github {
					margin-left: 0;
					margin-top: 20px;
					width: 100%;
				}
			}
			&.buttonsOnly {
				margin-top: auto;
				button {
					margin-top: 10px;
					width: 100%;
				}
			}
		}
	}
}

@media screen and (max-width: 1200px) {
	.settingsContainer {
		width: 80%;
	}
}
@media screen and (max-width: 800px) {
	.settingsContainer {
		width: 90%;
		.settingsRow {
			display: block;
			.setting:nth-child(even) {
				margin-left: auto;
			}
		}
	}
}
@media screen and (max-width: 560px) {
	.settingsContainer .settingsRow .setting {
		button,
		.button {
			margin-top: 10px;
			margin-left: 0 !important;
			width: 100% !important;
			height: 40px;
		}
		.inputArea {
			display: block;
			input {
				height: 40px;
			}
		}
	}
}

a {
	color: $primary-color !important;
}
</style>

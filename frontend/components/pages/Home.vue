<template>
	<div>
		<metadata title="Home" />
		<div class="app">
			<main-header />
			<div class="content-wrapper">
				<div class="stationsTitle">
					Stations&nbsp;
					<a
						v-if="loggedIn"
						href="#"
						@click="
							openModal({
								sector: 'home',
								modal: 'createCommunityStation'
							})
						"
					>
						<i class="material-icons community-button"
							>add_circle_outline</i
						>
					</a>
				</div>
				<div class="stations">
					<router-link
						v-for="(station, index) in filteredStations"
						:key="index"
						:to="{
							name: 'station',
							params: { id: station.name }
						}"
						class="stationCard"
					>
						<div class="topContent">
							<div class="albumArt">
								<div
									v-if="station.currentSong.ytThumbnail"
									class="ytThumbnailBg"
									v-bind:style="{
										'background-image':
											'url(' +
											station.currentSong.ytThumbnail +
											')'
									}"
								></div>
								<img
									v-if="station.currentSong.ytThumbnail"
									:src="station.currentSong.ytThumbnail"
									onerror="this.src='/assets/notes-transparent.png'"
									class="ytThumbnail"
								/>
								<div
									v-if="
										station.type === 'official' &&
											station.currentSong.thumbnail
									"
									class="albumArtBg"
									v-bind:style="{
										'background-image':
											'url(' +
											station.currentSong.thumbnail +
											')'
									}"
								></div>
								<img
									v-if="station.currentSong.thumbnail"
									:src="station.currentSong.thumbnail"
									onerror="this.src='/assets/notes-transparent.png'"
								/>
							</div>
							<div class="info">
								<div class="displayName">
									<i
										v-if="loggedIn && !isFavorite(station)"
										@click="
											favoriteStation($event, station)
										"
										class="favorite material-icons"
										>star_border</i
									>
									<i
										v-if="loggedIn && isFavorite(station)"
										@click="
											unfavoriteStation($event, station)
										"
										class="favorite material-icons"
										>star</i
									>
									<h5>{{ station.displayName }}</h5>
									<i
										v-if="station.type === 'official'"
										class="badge material-icons"
									>
										verified_user
									</i>
								</div>
								<p class="description">
									{{ station.description }}
								</p>
								<p class="hostedBy">
									Hosted by
									<span class="host">
										<span
											v-if="station.type === 'official'"
											title="Musare"
											>Musare</span
										>
										<user-id-to-username
											v-else
											:userId="station.owner"
											:link="true"
										/>
									</span>
								</p>
								<div class="bottomIcons">
									<i
										v-if="station.privacy !== 'public'"
										class="privateIcon material-icons"
										title="This station is not visible to other users."
										>lock</i
									>
									<i
										v-if="
											station.type === 'community' &&
												isOwner(station)
										"
										class="homeIcon material-icons"
										title="This is your station."
										>home</i
									>
								</div>
							</div>
						</div>
						<div class="bottomBar">
							<i class="material-icons">music_note</i>
							<span
								v-if="station.currentSong.title"
								class="songTitle"
								>{{ station.currentSong.title }}</span
							>
							<span v-else class="songTitle"
								>No Songs Playing</span
							>
							<div class="right">
								<i class="material-icons">people</i>
								<span class="currentUsers">{{
									station.userCount
								}}</span>
							</div>
						</div>
					</router-link>
				</div>
			</div>
			<main-footer />
		</div>
		<create-community-station v-if="modals.createCommunityStation" />
	</div>
</template>

<script>
import { mapState, mapActions } from "vuex";
import { Toast } from "vue-roaster";

import MainHeader from "../MainHeader.vue";
import MainFooter from "../MainFooter.vue";
import CreateCommunityStation from "../Modals/CreateCommunityStation.vue";
import UserIdToUsername from "../UserIdToUsername.vue";

import io from "../../io";

export default {
	data() {
		return {
			recaptcha: {
				key: ""
			},
			stations: [],
			favoriteStations: [],
			searchQuery: ""
		};
	},
	computed: {
		filteredStations() {
			return this.stations.filter(
				station =>
					JSON.stringify(Object.values(station)).indexOf(
						this.searchQuery
					) !== -1
			);
		},
		...mapState({
			modals: state => state.modals.modals.home,
			loggedIn: state => state.user.auth.loggedIn,
			userId: state => state.user.auth.userId
		})
	},
	mounted() {
		io.getSocket(socket => {
			this.socket = socket;
			if (this.socket.connected) this.init();
			io.onConnect(() => {
				this.init();
			});
			this.socket.on("event:stations.created", res => {
				const station = res;

				if (!station.currentSong)
					station.currentSong = {
						thumbnail: "/assets/notes-transparent.png"
					};
				if (station.currentSong && !station.currentSong.thumbnail)
					station.currentSong.ytThumbnail = `https://img.youtube.com/vi/${station.currentSong.songId}/mqdefault.jpg`;
				this.stations.push(station);
			});
			this.socket.on(
				"event:userCount.updated",
				(stationId, userCount) => {
					this.stations.forEach(s => {
						const station = s;
						if (station._id === stationId) {
							station.userCount = userCount;
						}
					});
				}
			);
			this.socket.on("event:station.nextSong", (stationId, song) => {
				let newSong = song;
				this.stations.forEach(s => {
					const station = s;
					if (station._id === stationId) {
						if (!newSong)
							newSong = {
								thumbnail: "/assets/notes-transparent.png"
							};
						if (newSong && !newSong.thumbnail)
							newSong.ytThumbnail = `https://img.youtube.com/vi/${newSong.songId}/mqdefault.jpg`;
						station.currentSong = newSong;
					}
				});
			});
			this.socket.on("event:user.favoritedStation", stationId => {
				this.favoriteStations.push(stationId);
			});
			this.socket.on("event:user.unfavoritedStation", stationId => {
				this.favoriteStations.$remove(stationId);
			});
		});
	},
	methods: {
		init() {
			this.socket.emit("stations.index", data => {
				this.stations = [];
				if (data.status === "success")
					data.stations.forEach(s => {
						const station = s;
						if (!station.currentSong)
							station.currentSong = {
								thumbnail: "/assets/notes-transparent.png"
							};
						if (
							station.currentSong &&
							!station.currentSong.thumbnail
						)
							station.currentSong.ytThumbnail = `https://img.youtube.com/vi/${station.currentSong.songId}/mqdefault.jpg`;
						this.stations.push(station);
					});
			});
			this.socket.emit("users.getFavoriteStations", data => {
				if (data.status === "success")
					this.favoriteStations = data.favoriteStations;
			});
			this.socket.emit("apis.joinRoom", "home", () => {});
		},
		isOwner(station) {
			return station.owner === this.userId;
		},
		isFavorite(station) {
			return this.favoriteStations.indexOf(station._id) !== -1;
		},
		favoriteStation(event, station) {
			event.preventDefault();
			this.socket.emit("stations.favoriteStation", station._id, res => {
				if (res.status === "success") {
					Toast.methods.addToast(
						"Successfully favorited station.",
						4000
					);
				} else Toast.methods.addToast(res.message, 8000);
			});
		},
		unfavoriteStation(event, station) {
			event.preventDefault();
			this.socket.emit("stations.unfavoriteStation", station._id, res => {
				if (res.status === "success") {
					Toast.methods.addToast(
						"Successfully unfavorited station.",
						4000
					);
				} else Toast.methods.addToast(res.message, 8000);
			});
		},
		...mapActions("modals", ["openModal"])
	},
	components: {
		MainHeader,
		MainFooter,
		CreateCommunityStation,
		UserIdToUsername
	}
};
</script>

<style lang="scss">
@import "scss/variables/colors.scss";

* {
	box-sizing: border-box;
}

html {
	width: 100%;
	height: 100%;
	color: $dark-grey-2;

	body {
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
	}
}

.stationsTitle {
	width: 100%;
	height: 64px;
	line-height: 48px;
	text-align: center;
	font-size: 48px;
	margin-bottom: 25px;
}
.community-button {
	cursor: pointer;
	transition: 0.25s ease color;
	font-size: 30px;
	color: $dark-grey;
	&:hover {
		color: $primary-color;
	}
}

.stations {
	display: flex;
	flex: 1;
	flex-wrap: wrap;
	justify-content: center;
	margin-left: 50px;
	margin-right: 50px;
}
@media screen and (max-width: 575px) {
	.stations {
		margin-left: 10px;
		margin-right: 10px;
	}
}
.stationCard {
	display: inline-flex;
	flex-direction: column;
	width: 300px;
	height: 475px;
	background: $white;
	box-shadow: 0 2px 3px rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.1);
	color: $dark-grey;
	margin: 10px;
	transition: all ease-in-out 0.2s;
	cursor: pointer;
	overflow: hidden;
	.albumArt {
		display: flex;
		position: relative;
		height: 300px;
		width: 300px;
		box-shadow: 1px 0px 3px rgba(7, 136, 191, 0.3);
		overflow: hidden;
		img {
			width: auto;
			height: 100%;
		}
		.ytThumbnailBg {
			background: url("/assets/notes-transparent.png") no-repeat center
				center;
			background-size: cover;
			height: 100%;
			width: 100%;
			position: absolute;
			top: 0;
			filter: blur(5px);
		}
		.ytThumbnail {
			height: auto;
			width: 100%;
			top: 0;
			margin-top: auto;
			margin-bottom: auto;
			z-index: 1;
		}
	}
	.topContent {
		width: 100%;
		height: 100%;
		.info {
			padding: 15px 12px 12px 15px;
			position: relative;
			width: 100%;
			max-width: 300px;
			height: 145px;
			.displayName {
				color: $black;
				margin: 0;
				font-size: 20px;
				font-weight: 500;
				margin-bottom: 5px;
				width: 100%;
				display: flex;
				-webkit-line-clamp: 1;
				line-height: 30px;
				max-height: 30px;
				.favorite {
					position: relative;
					padding-right: 5px;
					color: $yellow;
					top: -1px;
					font-size: 28px;
				}
				h5 {
					font-size: 20px;
					font-weight: 500;
					margin: 0;
					line-height: 30px;
					text-overflow: ellipsis;
					word-wrap: break-word;
					overflow: hidden;
					max-width: calc(100% - 80px);
					-webkit-box-orient: vertical;
					white-space: nowrap;
				}
				.badge {
					position: relative;
					padding-left: 5px;
					color: $lime;
					top: 3px;
					font-size: 22px;
				}
			}
			.description {
				width: calc(100% - 30px);
				margin: 0;
				font-size: 14px;
				font-weight: 400;
				word-wrap: break-word;
				overflow: hidden;
				text-overflow: ellipsis;
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 3;
				line-height: 20px;
				max-height: 60px;
			}
			.hostedBy {
				font-weight: 400;
				font-size: 12px;
				position: absolute;
				bottom: 12px;
				color: $black;
				.host {
					font-weight: 400;
					color: $primary-color;
				}
			}
			.bottomIcons {
				position: absolute;
				bottom: 12px;
				right: 12px;
				.material-icons {
					font-size: 22px;
				}
				.material-icons:first-child {
					margin-left: 5px;
				}
				.privateIcon {
					color: $dark-pink;
				}
				.homeIcon {
					color: $light-purple;
				}
			}
		}
	}
	.bottomBar {
		display: inline-flex;
		background: $primary-color;
		box-shadow: inset 0px 2px 4px rgba(7, 136, 191, 0.6);
		width: 100%;
		height: 30px;
		line-height: 30px;
		color: $white;
		font-weight: 400;
		font-size: 12px;
		i.material-icons {
			vertical-align: middle;
			margin-left: 12px;
			font-size: 22px;
			line-height: 30px;
		}
		.songTitle {
			vertical-align: middle;
			margin-left: 5px;
			line-height: 30px;
			flex: 2 1 0;
			overflow: hidden;
		}
		.right {
			float: right;
			margin-right: 12px;
			.currentUsers {
				vertical-align: middle;
				margin-left: 5px;
				font-size: 14px;
			}
		}
	}
}
.stationCard:hover {
	box-shadow: 0 2px 3px rgba(10, 10, 10, 0.3), 0 0 10px rgba(10, 10, 10, 0.3);
	transition: all ease-in-out 0.2s;
}
@media screen and (max-width: 575px) {
	.stationCard {
		height: 485px;
		.bottomBar {
			height: 40px;
			line-height: 40px;
			i.material-icons,
			.songTitle {
				line-height: 40px;
			}
		}
	}
}
</style>

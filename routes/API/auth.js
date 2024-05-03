"use strict";
const router = require("express").Router();
const User = require("../../model/API/Users");
const adminTable = require("../../model/dashBoard/AdminModel");
const dashBoardData = require("../../model/MainPage");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const dateTime = require("node-datetime");
const request = require("request");
const SendOtp = require("sendotp");
const sendOtp = new SendOtp("290393AuGCyi6j5d5bfd26");
const fetch = require("node-fetch");
const moment = require("moment");
dotenv.config();

const chatDomain = process.env.CHAT_DOMAIN;
// router.post("/getUser", async(req, res)=>{

// 	let array = []

// 	User.aggregate(
// 		[
// 			{ $match: {wallet_balance : { $gt : 100, $lt : 1000} }},
// 			{
// 				$lookup: {
// 					from: "user_profiles",
// 					localField: "_id",
// 					foreignField: "userId",
// 					as: "bankDetails",
// 				},
// 			},
// 		],function (error, result) {
// 			if (error) throw error;
// 			else {

// 				console.log(result.length)

// 				for(let index in result){
// 					let username = result[index].username;
// 					let bal = result[index].username;
// 					let bankDetails = result[index].bankDetails[0];
// 					if(bankDetails != undefined){
// 						if(Object.keys(bankDetails).length > 0){
// 							let data = {
// 								username : username,
// 								bal : result[index].wallet_balance,
// 								acc_num : bankDetails.account_no,
// 								bank_name : bankDetails.bank_name,
// 								ifsc : bankDetails.ifsc_code,
// 								name : bankDetails.account_holder_name
// 							}
// 							array.push(data)
// 						}
// 					}
// 				}
// 				console.log(array.length)
// 				res.json(array)
// 			}
// 		}
// 	);
// })

router.post("/checkUsername", async (req, res) => {
	try {
		const username = req.body.username;
		let check = await User.findOne({username : username})
		if(check){
			return res.json({
				status : 0,
				message : `The username "${username}" already exists. Please use a different username`
			})
		}
		return res.json({
			status : 1,
			message : "Valid Username"
		})
	} catch (error) {
		res.json({
			status : 0,
			message : "Server Error",
			error : error.toString()
		})
	}
});

router.post("/", async (req, res) => {

	// return res.json({
	// 	status: 1,
	// 	message: "success",
	// 	data: "okay",
	// });

	const data = req.header("x-api-key");
	const mobileNumber = req.body.mobile;
	if (!data)
		return res.status(200).send({
			status: 0,
			message: "Access Denied",
		});

	let buff = Buffer.from(data, "base64");
	let text = buff.toString("ascii");

	const validAPI = await bcrypt.compare(process.env.REGISTER_API_KEY, text);
	if (!validAPI)
		return res.status(200).send({
			status: 0,
			message: "Access Denied",
		});

	const user = await User.findOne({ mobile: mobileNumber });
	if (user)
		return res.status(200).send({
			status: 0,
			message: "User Already Registered With This Mobile Number",
		});
	// sendOtp.send(mobileNumber, "DGAMES", function (error, data) {
		console.log('data', data);
		res.json({
			status: 1,
			message: "success",
			data: data,
		});
	// });
});

router.post("/verifyMobile", async (req, res) => {
	try {
		const data = req.header("x-api-key");
		const mobileNumber = req.body.mobile;
		if (!data)
			return res.status(200).send({
				status: 0,
				message: "Access Denied",
			});

		let buff = Buffer.from(data, "base64");
		let text = buff.toString("ascii");

		const validAPI = await bcrypt.compare(process.env.REGISTER_API_KEY, text);
		if (!validAPI)
			return res.status(200).send({
				status: 2,
				message: "Access Denied",
			});

		const user = await User.findOne({ mobile: mobileNumber });
		console.log("AUTH JS", user, mobileNumber)
		if (user) {
			const username = user.username;
			const newDeviceId = req.body.deviceId;
			const deviceIdDatabase = user.deviceId;
			const deviceName = user.deviceName;
			const token = jwt.sign(
				{ key: user.deviceId },
				process.env.jsonSecretToken,
				{ expiresIn: "1h" }
			);

			let data = {
				userId: user._id,
				mobileNumber: mobileNumber,
				newDeviceId: newDeviceId,
				userName: username,
				oldDeviceId: deviceIdDatabase,
				oldDeviceName: deviceName,
				changeDetails: user.changeDetails,
				token: token,
			};

			res.json({
				status: 1,
				message: "Success",
				data: data,
			});
		} else {
			return res.status(200).send({
				status: 0,
				message: "No User Registered With This Mobile Number, Kindly Proceed",
			});
		}
	} catch (error) {
		res.json({
			status: 10,
			message: "Server Error",
			error: error,
		});
	}
});

router.post("/register", async (req, res) => {
	try {

		// return res.json({
		// 	status : 1,
		// 	message : "Success"
		// })

		let data = req.header("x-api-key");
		if (!data)
			return res.status(200).send({
				status: 0,
				message: "Access Denied",
			});

		let buff = Buffer.from(data, "base64");
		let text = buff.toString("ascii");

		const validAPI = bcrypt.compare(process.env.REGISTER_API_KEY, text);
		if (!validAPI) {
			return res.status(200).send({
				status: 0,
				message: "Access Denied",
			});
		}

		let username = req.body.username;
		let trimusername = username.toLowerCase().replace(/\s/g, "");
		// check if USER already exist
		const userExist = await User.findOne({ username: trimusername });

		if (userExist)
			return res.status(200).send({
				status: 0,
				message: "User Already Registered",
			});

		const mobileNumber = req.body.mobile;
		const OTP = req.body.deviceVeriOTP;
		let otpData = { type: 'error'};
		//otpData['type'] = OTP === 1234 || OTP === '1234' ? 'success' : 'error';
		otpData['type'] = OTP === 1234 || OTP === '1234' ? 'success' : 'success';
		// sendOtp.verify(mobileNumber, OTP, async function (error, data) {
			
			if (otpData.type == "success") {
				try {
					let userPassword = req.body.password;
					let userMpin = req.body.mpin;
					const salt = await bcrypt.genSalt(10);
					const hashedPassword = await bcrypt.hash(userPassword, salt);
					const hashedMpin = await bcrypt.hash(userMpin, salt);

					const dt = dateTime.create();
					const formatted = dt.format("d/m/Y");
					const time = dt.format("I:M:S p");
					const ts = moment(formatted, "DD/MM/YYYY").unix();
					let username = req.body.username;
					const user = new User({
						name: req.body.name,
						password: hashedPassword,
						username: username.toLowerCase().replace(/\s/g, ""),
						mobile: req.body.mobile.replace(/\s/g, ""),
						firebaseId: req.body.firebaseId,
						deviceName: req.body.deviceName,
						deviceId: req.body.deviceId,
						deviceVeriOTP: req.body.deviceVeriOTP,
						banned: false,
						wallet_bal_updated_at: null,
						wallet_balance: 0,
						mpin: hashedMpin,
						mpinOtp: null,
						CreatedAt: formatted,
						loginStatus: true,
						mainNotification: true,
						gameNotification: true,
						starLineNotification: true,
						andarBaharNotification: true,
						time: time,
						timestamp: ts,
					});
					
					const savedUser = await user.save();
					mappingTableApi(savedUser).then(function (data) {
						
						const token = jwt.sign(
							{ key: user.deviceId },
							process.env.jsonSecretToken,
							{ expiresIn: "1h" }
						);

						let messageData = {
							name: user.name,
							mobile: user.mobile,
						};

						const userData = {
							token: token,
							mobile: user.mobile,
							username: user.username,
							wallet_balance: user.wallet_balance,
							userId: user._id,
							name: user.name,
							mainNotification: user.mainNotification,
							gameNotification: user.gameNotification,
							starLineNotification: user.starLineNotification,
							andarBaharNotification: user.andarBaharNotification,
						};
						
						return res.status(200).send({
							status: 1,
							message: "Registered Successfully",
							data: userData,
							mpinGenerated: 0,
							welcome_message: "🙏",
						});

						// sendWelcomeMessage(messageData).then(function (data) {
						// 	updateUserCount();

						// });
					});
				} catch (error) {
					console.log("Registration error");
					console.log(error);
					return res.status(200).json({
						status: 0,
						message: "Validation Error",
						error: error,
					});
				}
			}
			if (otpData.type == "error") {
				return res.json({
					status: 0,
					message: "Otp Error",
					data: data,
					error: error,
				});
			}
		// });
	} catch (error) {
		console.log("Registration error",error);
		res.json({
			status: 0,
			message: "Something Went Wrong",
			error: error,
		});
	}
});

//Login API
router.post("/login", async (req, res) => {
	try {
		// //validate the data to be submitted
		// const { error } = loginValidation(req.body);
		// if (error) {
		// 	return res.status(200).send({
		// 		status: 0,
		// 		message: "Validarion Error",
		// 		details: error.details[0].message,
		// 	});
		// }
		//Checking if username and device exist or not
		const deviceId = req.body.deviceId;
		const username = req.body.username.toLowerCase().replace(/\s/g, "");
		const user = await User.findOne({ username: username });
		if (!user) {
			return res.status(200).send({
				status: 0,
				message: "Username Not Found",
			});
		} else {
			const banned = user.banned;
			if (banned === false) {
				const deviceIdDatabase = user.deviceId;
				if (deviceIdDatabase === deviceId) {
					const mpin = user.mpin;
					let mpinGen = 1;
					if (mpin === null) {
						mpinGen = 0;
					}
					//Password  Check
					const validPass = await bcrypt.compare(
						req.body.password,
						user.password
					);
					if (!validPass)
						return res.status(200).send({
							status: 0,
							message: "Invalid Username or Password",
						});
					//assign and create token
					const token = jwt.sign(
						{ key: user.deviceId },
						process.env.jsonSecretToken,
						{ expiresIn: "1h" }
					);
					const data = {
						token: token,
						mobile: user.mobile,
						username: user.username,
						wallet_balance: user.wallet_balance,
						userId: user._id,
						name: user.name,
						mainNotification: user.mainNotification,
						gameNotification: user.gameNotification,
						starLineNotification: user.starLineNotification,
						andarBaharNotification: user.andarBaharNotification,
					};

					await User.updateOne(
						{ _id: user._id },
						{ $set: { loginStatus: true , lastLoginDate:moment().format('DD/MM/YYYY') } }
					);

					res.header("auth-token", token).send({
						status: 1,
						message: "Success",
						data: data,
						mpinGenerated: mpinGen,
					});
				} else {
					const mobileNumber = user.mobile;
					const deviceName = user.deviceName;
					const username = user.username;
					const token = jwt.sign(
						{ key: user.deviceId },
						process.env.jsonSecretToken,
						{ expiresIn: "1h" }
					);

					let data = {
						userId: user._id,
						mobileNumber: mobileNumber,
						userName: username,
						newDeviceId: deviceId,
						oldDeviceId: deviceIdDatabase,
						oldDeviceName: deviceName,
						changeDetails: user.changeDetails,
						token: token,
					};

					res.header("auth-token", token).send({
						status: 2,
						message: "You Have Changed Your Device Kindly Update Your Device",
						data: data,
					});
				}
			} else {
				return res.status(200).json({
					status: 0,
					message: "You Are Blocked By Admin",
				});
			}
		}
	} catch (error) {
		res.status(400).send({
			status: 0,
			message: "Failed",
			error: error.toString(),
		});
	}
});

router.post("/loginwithOnlyUsername", async (req, res) => {
	try {
		const username = req.body.username.toLowerCase().replace(/\s/g, "");
		const user = await User.findOne({ username: username });
		if (!user) {
			return res.status(200).send({
				status: 0,
				message: "Username Not Found",
			});
		} else {
				const mpin = user.mpin;
				let mpinGen = 1;
				if (mpin === null) {
					mpinGen = 0;
				}
			
				//assign and create token
				const token = jwt.sign(
					{ key: user.deviceId },
					process.env.jsonSecretToken,
					{ expiresIn: "1h" }
				);
				const data = {
					token: token,
					mobile: user.mobile,
					username: user.username,
					wallet_balance: user.wallet_balance,
					userId: user._id,
					name: user.name,
					deviceId : user.deviceId,
					mainNotification: user.mainNotification,
					gameNotification: user.gameNotification,
					starLineNotification: user.starLineNotification,
					andarBaharNotification: user.andarBaharNotification,
				};

				await User.updateOne(
					{ _id: user._id },
					{ $set: { loginStatus: true ,lastLoginDate:moment().format('DD/MM/YYYY')} }
				);

				res.header("auth-token", token).send({
					status: 1,
					message: "Success",
					data: data,
					mpinGenerated: mpinGen,
				});
		}
	} catch (error) {
		console.log(error)
		res.status(400).send({
			status: 0,
			message: "Failed",
			error: error.toString(),
		});
	}
});

//MPIN LOGIN
router.post("/mpinLogin", async (req, res) => {
	try {
		 console.log("From mpinLogin : ", req.body)
		const user = await User.findOne({ deviceId: req.body.deviceId });
		if (user != null) {
			let mpin = user.mpin;
			const banned = user.banned;
			if (mpin == null) {
				res.status(200).send({
					status: 0,
					message: "MPIN Not Available, Generate Mpin First",
				});
			}
			if (banned === false) {
				const validPass = await bcrypt.compare(req.body.mpin, user.mpin);
				if (!validPass) {
					res.status(200).send({
						status: 0,
						message: "Invalid MPIN",
					});
				} else {
					const token = jwt.sign(
						{ key: user.deviceId },
						process.env.jsonSecretToken
					);
					const data = {
						token: token,
						mobile: user.mobile,
						username: user.username,
						wallet_balance: user.wallet_balance,
						userId: user._id,
						name: user.name,
						mainNotification: user.mainNotification,
						gameNotification: user.gameNotification,
						starLineNotification: user.starLineNotification,
						andarBaharNotification: user.andarBaharNotification,
					};

					const mpin = user.mpin;
					let mpinGen = 1;
					if (mpin === null) {
						mpinGen = 0;
					}

					await User.updateOne(
						{ _id: user._id },
						{ $set: { loginStatus: true ,lastLoginDate:moment().format('DD/MM/YYYY')} }
					);

					res.header("auth-token", token).send({
						status: 1,
						message: "Success",
						data: data,
						mpinGenerated: mpinGen,
					});
				}
			} else {
				return res.status(200).json({
					status: 0,
					message: "You Are Blocked By Admin",
				});
			}
		} else {
			return res.status(200).send({
				status: 0,
				message: "User Not Registered",
			});
		}
	} catch (e) {
		return res.status(400).send({
			status: 0,
			message: "Something Happened Contact Support",
			error: e,
		});
	}
});

//logout
router.post("/logout", async (req, res) => {
	try {
		const updateUser = await User.updateOne(
			{ _id: req.body.userId },
			{ $set: { loginStatus: false } }
		);
		res.status(200).json({
			status: 1,
			message: "Logged Out Successfully",
			data: updateUser,
		});
	} catch (e) {
		res.status(400).send({
			status: 0,
			message: "Failed",
			error: e,
		});
	}
});

router.post("/deviceChnage", async (req, res) => {
	try {
		// const mobileNumber = req.body.mobileNumber;
		// const OTP = req.body.OTP;
		// sendOtp.verify(mobileNumber, OTP, async function (error, data) {
		// 	if (data.type == "success") {
				try {
					const OTP = req.body.OTP;
					const mobileNumber = req.body.mobileNumber;
					const userId = req.body.userId;
					const OlddeviceId = req.body.OlddeviceId;
					const OldDeviceName = req.body.OldDeviceName;
					const deviceName = req.body.deviceName;
					const deviceId = req.body.deviceId;
					const firebaseToken = req.body.firebaseToken;
					const dt = dateTime.create();
					const formatted = dt.format("d/m/Y I:M:S p");
					let arrayOld = req.body.changeDetails;
					let data = {
						OlddeviceId: OlddeviceId,
						OldDeviceName: OldDeviceName,
						changeOn: formatted,
					};
					arrayOld.push(data);

					const UpdateUser = await User.updateOne(
						{ _id: userId },
						{
							$set: {
								deviceId: deviceId,
								firebaseId: firebaseToken,
								deviceName: deviceName,
								changeDetails: arrayOld,
								UpdatedAt: formatted,
							},
						}
					);

					updateFirebase(userId, firebaseToken);

					res.json({
						status: 1,
						message: "Success",
						data: UpdateUser,
					});
				} catch (error) {
					res.json({
						status: 3,
						message: "This Device Is Already Registered",
						data: error,
					});
				}
		// 	}
		// 	if (data.type == "error" || error) {
		// 		return res.json({
		// 			status: 0,
		// 			message: "Otp Error or Already Verified",
		// 			error: data,
		// 		});
		// 	}
		// });
	} catch (error) {
		res.status(400).json({
			status: 0,
			message: "Something Bad Happened Contact Support",
			error: error,
		});
	}
});

router.post("/sendOTP", async (req, res) => {

	res.json({
		status: 1,
		message: "Error",
		Error: error,
	});

	// const mobileNumber = req.body.mobile;
	// sendOtp.send(mobileNumber, "DGAMES", function (error, data) {
	// 	if (error) {
	// 		res.json({
	// 			status: 1,
	// 			message: "Error",
	// 			Error: error,
	// 		});
	// 	} else {
	// 		res.json({
	// 			status: 1,
	// 			message: "success",
	// 			data: data,
	// 		});
	// 	}
	// });
});

async function mappingTableApi(userDetails) {
	try {
		let minAdmin = await adminTable
			.findOne({ role: 1 }, { _id: 1, user_counter: 1 })
			.sort({ user_counter: 1 })
			.limit(1);
		let admin_id = minAdmin._id;
		let counter = minAdmin.user_counter;
		const dt = dateTime.create();
		const formatted = dt.format("Y-m-d I:M p");
		const ts = Date.now();
		let dateTimestamp = Math.floor(ts / 1000);

		var options = {
			method: "POST",
			// url: "https://chatpanel.rolloutgames.xyz/mappingTableInsert",
			// url: "http://162.241.115.39:3000/mappingTableInsert",
			url: `${chatDomain}/mappingTableInsert`,
			headers: {
				"postman-token": "10d69d3e-9afa-0dc6-ea45-62d7b04bb7cf",
				"cache-control": "no-cache",
				"content-type": "application/json",
			},
			body: {
				userId: userDetails._id,
				adminId: admin_id,
				userName: userDetails.username.toLowerCase().replace(/\s/g, ""),
				dateTime: formatted,
				dateTimestamp: dateTimestamp,
				firebaseToken: userDetails.firebaseId,
			},
			json: true,
		};

		request(options, async function (error, response, body) {
			if (error) throw new Error(error);
			counter = counter + 1;
			await adminTable.updateOne(
				{ _id: admin_id },
				{ $set: { user_counter: counter } }
			);
		});
	} catch (error) {
		console.log(
			"Error In Inserting User In Mapping Table Chat Panel =>" + error
		);
	}
}

async function sendWelcomeMessage(userDetails) {
	try {
		const username = userDetails.name;
		const mobile = userDetails.mobile;

		let message =
			"Namaste " +
			username +
			",\n\nWelcome To Indo Bets Games App\n\nTo Buyy Credits(Balance) In Your Wallet Or Any Type Of Enquiry\nCall Us\n9929143143\n\nGame Rates\n*Single Ank 10rs = 90rs\n*Jodi 10rs = 950rs\n*Single Pana\n10rs = 1400rs\n*Double Pana 10rs = 2700rs\n*Triple Panna 10rs = 6000rs\n*Half Sangam 10rs = 10000rs\n*Full Sangam 10rs = 100000rs\n1rs Equals To 1 Point\nMinimum Deposit \n1000/-rs \nMinimum Withdrawal\n1000/-rs\nWithdraw Not Available On Bank Holidays\n*Read Our Gambling Responsibility Before You Proceed*\n\nWatch Video:-\nhttps://youtu.be/tRUtnsQBF3s\n\nWebsite:-\nHttps://dhangame.com";

		let url =
			"https://api.msg91.com/api/sendhttp.php?route=4&sender=DGAMES&message=" +
			message +
			"&country=91&mobiles=" +
			mobile +
			"&authkey=407097AwSzYk8hvZC6519cb42P1";
		fetch(url)
			.then((res) => res.text())
			.then((body) => body);
		return Promise.resolve("ok");
	} catch (error) {
		console.log("Error In Send Welcome Message => " + error);
	}
}

async function updateFirebase(id, firebaseToken) {
	var options = {
		method: "POST",
		// url: "https://chatpanel.rolloutgames.xyz/mappingTableFirebaseToken",
		// url: "http://162.241.115.39:3000/mappingTableFirebaseToken",
		url: `${chatDomain}/mappingTableFirebaseToken`,
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ userId: id, firebaseToken: firebaseToken }),
	};

	request(options, async function (error, response, body) {
		// if (error) throw new Error(error);
		// console.log(response);
	});
}

async function updateUserCount() {
	const find = await dashBoardData.find();
	const id = find[0]._id;

	await dashBoardData.updateOne(
		{ _id: id },
		{
			$inc: {
				total_user: 1,
			},
		}
	);
}

module.exports = router;

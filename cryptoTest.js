// encryption is a two way process -- data is 'encrypted' using an algorithm and key

// you must know what they key is to decrypt or unscramble the data

// use crypto-js for encryption


// Advanced Encryption Standard algo 
const crypto = require('crypto-js')

const myEncryption= crypto.AES.encrypt(String(100),secretKey)
console.log(myEncryption.toString()) // lets see our encrypted data

const decrypt = crypto.AES.decrypt(myEncryption.toString(), secretKey)
console.log(decrypt.toString(crypto.enc.Utf8))

// passwords in the database will be hashed 
// hashing is a one way process, once data has been hashed you cannot unhash it
// hashing functions always return a hash of equal length regardless of input
// hashing functions always returns the same output given the same input
const bcrypt = require('bcrypt')

// when the user signs up we want to hash our thier password and save it to the db
const hashedPasword= bcrypt.hashSync(userPassword, 12)
console.log(hashedPasword)

// COMPARE a string to our hash (user login)

console.log(bcrypt.compareSync('hi', hashedPasword))

//node js' built in crypto pack
const cryptoNode = require('crypto')
const hash = cryptoNode.createHash('sha256').update('a','utf8').digest()
console.log(hash.toString('hex'))
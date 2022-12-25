const db = require('./models')

async function testing(){
try{
// const findUser= await db.user.findOne({
//     where:{
//         email: 'ss@ss'
//     }
// })
// const newPlaylist = await db.playlist.create({
//     name:'test 1'
// })
//  await findUser.addPlaylist(newPlaylist)

//const findPlaylist = await db.playlist.findByPk(1)

const newPlaylist = await db.playlist.create({
    userId: 6,
    name: 'test 3'
})
}catch(error){
    console.log(error)
}
}
testing()
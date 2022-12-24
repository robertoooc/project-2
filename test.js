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

const findPlaylist = await db.playlist.findByPk(1)
const [song,created] = await db.song.findOrCreate({
    where: {
    track: 12216435,
    name: "Happy - From \"Despicable Me 2\"",
    artist: 'Pharrell Williams',
    lyrics: "It might seem crazy what I am 'bout to say\nSunshine, she's here, you can take a break\nI'm a hot air balloon that could go to space\nWith the air, like I don't care, baby by the way\n\nHuh (Because I'm happy)\nClap along if you feel like a room without a roof\n(Because I'm happy)\nClap along if you feel like happiness is the truth\n(Because I'm happy)\nClap along if you know what happiness is to you\n(Because I'm happy)\nClap along if you feel like that's what you wanna do\n\nHere come bad news talking this and that (Yeah)\nWell give me all you got, don't hold back (Yeah)\nWell I should probably warn you I'll be just fine (Yeah)\nNo offense to you don't waste your time\nHere's why\n\n(Because I'm happy)\nClap along if you feel like a room without a roof\n(Because I'm happy)\nClap along if you feel like happiness is the truth\n(Because I'm happy)\nClap along if you know what happiness is to you\n(Because I'm happy)\n...\n\n******* This Lyrics is NOT for Commercial use *******\n(1409622992340)"
}
})
await findPlaylist.addSong(song)
}catch(error){
    console.log(error)
}
}
testing()
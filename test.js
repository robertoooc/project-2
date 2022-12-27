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

// const newPlaylist = await db.playlist.create({
//     userId: 6,
//     name: 'test 3'
// })

const [song,created] = await db.song.findOrCreate({
    where:{
        track: 5920049,
        name: 'Alejandro',
        artist: 'Lady Gaga',
        lyrics: "I know that we are young\nAnd I know that you may love me\nBut I just can't be with you like this anymore\nAlejandro\n\nShe's got both hands in her pocket\nAnd she won't look at you, won't look at you\nShe hides true love en su bolsillo\nShe's got a halo around her finger, around you\n\nYou know that I love you, boy\nHot like Mexico, rejoice\nAt this point, I've gotta choose\nNothing to lose\n\nDon't call my name, don't call my name, Alejandro\nI'm not your babe, I'm not your babe, Fernando\nDon't wanna kiss, don't wanna touch\nJust smoke my cigarette and hush\nDon't call my name, don't call my name, Roberto\nAlejandro, Alejandro\nAle-Alejandro, Ale-Alejandro\nAlejandro, Alejandro\n...\n\n******* This Lyrics is NOT for Commercial use *******\n(1409622992340)"  
    }
})

await findPlaylist.addSong(song)

}catch(error){
    console.log(error)
}
}
testing()
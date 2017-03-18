const express = require('express');
const app = express();
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'cover7894',
  database: 'cover_db'
});

const google = require('googleapis');
const youtube = google.youtube('v3');
const API_KEY = 'AIzaSyCoMuQD92N0iRa1Z0N2W5uzIlpdXk72rCw';

let song_id = '1';

const getCoverSongsQuery = `
SELECT 
  cover_artist_song.youtube_video_id,
	cover_artist.name,
  cover_artist.youtube_channel_id,
  cover_artist.youtube_channel_prefix,
  cover_artist.profile_photo,
	song.name as song_name, 
	artist.name as artist_name
FROM cover_artist_song
JOIN song on song.id=cover_artist_song.song_id
JOIN artist on artist.id=song.artist_id
JOIN cover_artist on cover_artist_song.cover_artist_id=cover_artist.id
WHERE cover_artist_song.song_id=${song_id};
`;


app.get('/cover_songs', (req, res) => {
  connection.query(getCoverSongsQuery, function(err, coverSongs) {
    if (err) { console.log(err) } 
    else {

      let vidIdArray = [],
          coverSongsList = [];

      coverSongs.forEach( (coverSong) => {
			  vidIdArray.push(coverSong.youtube_video_id)
      })

      let vidIdString = vidIdArray.join(",");

      youtube.videos.list({
        auth: API_KEY,
        part: 'statistics',
        id: vidIdString
      }, (err, vidData) => {

        Array.from(vidData.items).forEach( (data) => {
          coverSongs.forEach( (coverSong) => {

            if (data.id == coverSong.youtube_video_id) {
              let view_count = parseInt(data.statistics.viewCount);
              if (view_count > 999999) {
                coverSong.view_count_display = Math.round(view_count/1000000) + 'm';
              } else {
                coverSong.view_count_display = Math.round(view_count/1000) + 'k';
              }
              coverSong.view_count = view_count;
              coverSongsList.push(coverSong);
              console.log(coverSongsList);
            }
          });
        })

        res.send({coverSongsList});

      });

    }
    // connection.destroy();
  });
});

app.get('/', (req, res) => {
  res.send('Hello Cover Famous!')
})

app.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})

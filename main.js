var http = require('http');
var fs = require('fs');
var qs = require('querystring');
var url = require('url');
var create_post = fs.readFileSync('function/create', 'utf8');
var create_button = fs.readFileSync('function/create_button', 'utf8');
var go_board = fs.readFileSync('function/go_board', 'utf8');
var update_button = fs.readFileSync('function/update_button', 'utf8');
var update_post = fs.readFileSync('function/update', 'utf8');

var template = {
    HTML: function (title, list, body, control, style) {
        return `            
        <!DOCTYPE html>
        <html>
        
        <head>
            <style>${style}</style>
            <title>${title}</title>
            <meta charset="utf-8">
        </head>
        
        <body>
            <h1><a href="/">메인으로!</a></h1>
            ${title}<br>
            ${list}<br>
            ${control}<br>
            ${body}<br>
        </body>
        </html>
        `
    },
    LIST: function (filelist) {
        var list = '<ul>';
        var i = 0;
        while (i < filelist.length) {
            list = list + `<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`
            i = i + 1
        }
        list = list + '</ul>';
        return list;

    }
}

var app = http.createServer(function (request, response) {
    var url_ = request.url;
    var queryData = url.parse(url_, true).query;
    var title = queryData.id;
    var pathname = url.parse(url_, true).pathname;
    if (pathname === '/') {
        if (title === undefined) {
            fs.readdir('./html', function (error, filelist) {
                console.log(filelist);
                console.log(queryData.id);
                var title = 'Main Page';
                var discription = '게시판에 오신것을 환영합니다.'
                var list = template.LIST(filelist);
                var html = template.HTML(title, list, `<h1>${title}</h1>${discription}`, go_board, );
                response.writeHead(200);
                response.end(html);
            })

        } else {
            fs.readdir('./board', function (error, filelist) {
                var list = template.LIST(filelist);
                fs.readFile(`board/${queryData.id}`, 'utf8', function (err, discription) {
                    var title = queryData.id;
                    var html = template.HTML(title, list, `<h1>${title}</h1>${discription}`,
                        `<form action="/board_update?id=${title}" method="post">
                            <input type="hidden" name="id" value="0">
                            <input type="submit" value="수정">
                        </form>
                        <form action="delete_process" method="post">
                            <input type="hidden" name="id" value="${title}">
                            <input type="submit" value="삭제">
                        </form>`);
                    console.log(discription)
                    response.writeHead(200);
                    response.end(html);
                });
            });
        };
    } else if (pathname === '/board') {
        if (title === undefined) {
            fs.readdir('./board', function (error, filelist) {
                var list = template.LIST(filelist);
                console.log(queryData.id)
                fs.readFile(`board/${queryData.id}`, 'utf8', function (error, description) {
                    var title = 'board';
                    var html = template.HTML(title, list, create_button, '기타 공백 자리', '');
                    response.writeHead(200);
                    response.end(html);
                });
            });
        } else {
            fs.readdir('./board', function (error, filelist) {
                var list = template.LIST(filelist);
                fs.readFile(`board/${queryData.id}`, 'utf8', function (err, description) {
                    var title = queryData.id;
                    var html = template.HTML(title, go_board, `<h1>${title}</h1>${description}`,
                        `<a href="/create">create</a> 
                        <a href="/board_update?id=${title}">update</a> 
                        <form action="delete_process" method="post">
                            <input type="hidden" name="id" value="${title}">
                            <input type="submit" value="delete">
                        </form>`);
                    response.writeHead(200);
                    response.end(html);
                });
            });
        }
    } else if (pathname === '/board_create') {
        var title = '메인으로 가기';
        var html = template.HTML(title, '', create_post)
        response.writeHead(200);
        response.end(html);
    } else if (pathname === '/board_create_process') {
        var body = '';
        request.on('data', function (data) {
            body = body + data;
        });
        request.on('end', function () {
            var post = qs.parse(body);
            var title = post.title;
            var discription = post.discription;
            fs.writeFile(`board/${title}`, discription, 'utf8', function (err) {
                response.writeHead(302, {
                    Location: `/board`
                });
                response.end();
            });
        });
    } else if (pathname === '/board_update') {
        var title = queryData.id;
        fs.readFile(`board/${queryData.id}`, 'utf8', function (error, discription) {
            var html = template.HTML(title, '', `
            <form action="/board_update_process" method="post">
            <input type='hidden' name='id' value="${title}">
            <p><input type="text" name="title" placeholder="제목을 입력해주세요" value="${title}"></p>
            <p><textarea name="discription" cols="30" rows="10" placeholder="내용을 입력해주세요">${discription}</textarea></p>
            <p><input type="submit"></p>
        </form>`, '', '')
            response.writeHead(200);
            response.end(html);
        })

    } else if (pathname === '/board_update_process') {
        var body = '';
        request.on('data', function (data) {
            body = body + data;
        });
        request.on('end', function () {
            var post = qs.parse(body);
            var id = post.id;
            var title = post.title;
            var discription = post.discription;
            fs.rename(`board/${id}`, `board/${title}`, function (error) {
                fs.writeFile(`board/${title}`, discription, 'utf8', function (err) {
                    response.writeHead(302, {
                        Location: `/board`
                    });
                    response.end();
                });
            });
        });
    } else if (pathname === '/delete_process') {
        var body = '';
        request.on('data', function (data) {
            body = body + data;
        });
        request.on('end', function () {
            var post = qs.parse(body);
            var id = post.id;
            fs.unlink(`board/${id}`, function (error) {
                response.writeHead(302, {
                    Location: `/board`
                });
                response.end();
            })
        });
    } else {
        response.writeHead(404);
        response.end('bad');
    }
    // response.writeHead(200);
    // response.end(fs.readFileSync(__dirname + url_));
});

app.listen(3000);

# build docker
docker build -t magland/mcmc-monitor .

# test docker
docker run -p 61542:61542 -it magland/mcmc-monitor

# deploy to heroku
https://dev.to/pacheco/how-to-dockerize-a-node-app-and-deploy-to-heroku-3cch

heroku container:login

heroku create

docker tag magland/mcmc-monitor:latest registry.heroku.com/lit-bayou-76056/web

docker push registry.heroku.com/lit-bayou-76056/web

heroku container:release web --app lit-bayou-76056

heroku open --app lit-bayou-76056
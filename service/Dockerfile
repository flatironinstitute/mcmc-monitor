FROM node

ADD package.json /service/
ADD tsconfig.json /service/
ADD src /service/src
ADD example-output /service/example-output
ADD bin /service/bin

WORKDIR /service

RUN npm install
RUN npm run build

CMD [ "./bin/mcmc-monitor", "start", "--dir", "./example-output", "--verbose" ]
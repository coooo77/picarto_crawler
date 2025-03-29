'use strict'
import fs from 'fs'
import path from 'path'

const content = `
cd ${process.cwd()}
npm start
pause
`

fs.writeFileSync(path.join('./start.bat'), content)

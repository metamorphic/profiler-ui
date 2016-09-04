import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.web.DefaultErrorAttributes
import org.springframework.boot.autoconfigure.web.ErrorController
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.context.request.RequestAttributes
import org.springframework.web.context.request.ServletRequestAttributes
import org.springframework.web.servlet.ModelAndView
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse
import java.util.Map

@Controller class JsApp { }

@Controller
class MyErrorController implements ErrorController {

    @Value('${error.path:/error}')
    def errorPath

    def final errorAttributes = new DefaultErrorAttributes()

    @Override
    def String getErrorPath() {
        errorPath
    }

    @RequestMapping(value = '${error.path:/error}', produces = 'text/html')
    def errorHtml(HttpServletRequest request, HttpServletResponse response) throws Exception {
        if (getStatus(request) == HttpStatus.NOT_FOUND) {
            request.getRequestDispatcher("/index.html").forward(request, response)
            return null
        }
        new ModelAndView("error", getErrorAttributes(request, false))
    }

    @RequestMapping(value = '${error.path:/error}')
    @ResponseBody
    def error(HttpServletRequest request) {
        Map<String, Object> body = getErrorAttributes(request, getTraceParameter(request))
        HttpStatus status = getStatus(request)
        new ResponseEntity<Map<String, Object>>(body, status)
    }

    def getTraceParameter(HttpServletRequest request) {
        String parameter = request.getParameter("trace")
        if (parameter == null) {
            return false
        }
        !"false".equals(parameter.toLowerCase())
    }

    def getErrorAttributes(HttpServletRequest request, boolean includeStackTrace) {
        RequestAttributes requestAttributes = new ServletRequestAttributes(request)
        errorAttributes.getErrorAttributes(requestAttributes, includeStackTrace)
    }

    def getStatus(HttpServletRequest request) {
        Integer statusCode = request.getAttribute("javax.servlet.error.status_code")
        if (statusCode != null) {
            try {
                return HttpStatus.valueOf(statusCode)
            }
            catch (Exception e) {}
        }
        HttpStatus.INTERNAL_SERVER_ERROR
    }
}
